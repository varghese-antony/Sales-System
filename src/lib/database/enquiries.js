import { supabase } from '../supabase'
import { getProductsByIdsV2 } from './products-v2'

const STATUS_VALUES = ['new', 'contacted', 'quoted', 'won', 'lost']

const VALID_PRODUCT_TABLES = new Set(['indoor', 'outdoor'])

const toLowerSafe = (value) =>
  typeof value === 'string' ? value.toLowerCase() : value

const inferProductTable = (item = {}) => {
  const tableCandidates = [
    item.table,
    item.productTable,
    item.sourceTable,
    item.type,
    item.productType,
    item.category
  ]

  for (const candidate of tableCandidates) {
    const normalized = toLowerSafe(candidate)
    if (normalized && VALID_PRODUCT_TABLES.has(normalized)) {
      return normalized
    }
  }

  if (item.Indoor || item.indoor) return 'indoor'
  if (item.Outdoor || item.outdoor) return 'outdoor'

  return null
}

const getCartItemProductId = (item = {}) =>
  item.productId ?? item.product_id ?? item.id ?? null

const getCartItemQuantity = (item = {}) => {
  const quantityValue = item.quantity ?? item.qty ?? item.count ?? 1
  const quantityNumber = Number(quantityValue)
  return Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : 1
}

const buildProductReferences = (enquiries = []) => {
  const seen = new Set()
  const references = []

  enquiries.forEach((enquiry) => {
    const cartItems = Array.isArray(enquiry.cartItems) ? enquiry.cartItems : []

    cartItems.forEach((item) => {
      const id = getCartItemProductId(item)
      const table = inferProductTable(item)

      if (!id || !table) return

      const key = `${table}-${id}`
      if (!seen.has(key)) {
        seen.add(key)
        references.push({ table, id })
      }
    })
  })

  return references
}

const buildProductLookup = async (enquiries = []) => {
  const references = buildProductReferences(enquiries)

  if (references.length === 0) {
    return new Map()
  }

  try {
    // Convert table references to type references for v2
    const v2References = references.map(({ table, id }) => ({
      type: table,
      id
    }))
    const products = await getProductsByIdsV2(v2References)
    return new Map(
      (products || []).map((product) => [`${product.type}-${product.id}`, product])
    )
  } catch (error) {
    console.error('Error building product lookup for enquiries:', error)
    return new Map()
  }
}

const enrichCartItem = (item = {}, productLookup = new Map()) => {
  const productId = getCartItemProductId(item)
  const table = inferProductTable(item)
  const key = table && productId ? `${table}-${productId}` : null
  const product = key ? productLookup.get(key) : null
  const quantity = getCartItemQuantity(item)

  const enriched = {
    ...item,
    id: productId ?? item.id ?? null,
    table: table || item.table || null,
    quantity
  }

  // Handle v2 field names (product_name, model_number from v2 tables)
  const modelNumber =
    product?.model_number ||
    product?.modelNumber ||
    item.model_number ||
    item.modelNumber ||
    null

  if (modelNumber) {
    enriched.model_number = modelNumber
    if (!enriched.modelNumber) {
      enriched.modelNumber = modelNumber
    }
  }

  // Handle v2 product_name field
  const productName =
    product?.product_name ||
    product?.name ||
    item.product_name ||
    item.name ||
    null

  if (productName) {
    enriched.product_name = productName
    if (!enriched.name) {
      enriched.name = productName
    }
  }

  const productType =
    product?.producttype ||
    item.producttype ||
    item.productType ||
    null

  if (productType) {
    enriched.producttype = productType
    if (!enriched.productType) {
      enriched.productType = productType
    }
  }

  if (product) {
    enriched.product = product
  }

  return enriched
}

const transformEnquiryRecord = (enquiry, productLookup = new Map()) => {
  const customerDetails = enquiry.customer_details || enquiry.customerDetails || {}
  const cartItems = Array.isArray(enquiry.cart_items) 
    ? enquiry.cart_items 
    : Array.isArray(enquiry.cartItems) 
    ? enquiry.cartItems 
    : []

  const enrichedCartItems = cartItems.map((item) => enrichCartItem(item, productLookup))

  return {
    id: enquiry.id,
    customer_name: customerDetails.name || '',
    company: customerDetails.company || '',
    email: customerDetails.email || '',
    phone: customerDetails.phone || '',
    message: customerDetails.message || '',
    address: customerDetails.address || '',
    delivery_method:
      customerDetails.deliveryMethod || customerDetails.delivery_method || null,
    delivery_time:
      customerDetails.deliveryTime || customerDetails.delivery_time || null,
    cart_items: enrichedCartItems,
    status: enquiry.status || 'new',
    created_at: enquiry.created_at,
    updated_at: enquiry.updated_at || enquiry.created_at,
    customer_details: customerDetails
  }
}

const transformEnquiriesWithProducts = async (enquiries = []) => {
  if (!Array.isArray(enquiries) || enquiries.length === 0) {
    return []
  }

  const productLookup = await buildProductLookup(enquiries)

  return enquiries.map((enquiry) => transformEnquiryRecord(enquiry, productLookup))
}

// Get all enquiries with optional filtering
export async function getAllEnquiries(filters = {}) {
  try {
    let query = supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.searchTerm) {
      query = query.or(`customer_details->>name.ilike.%${filters.searchTerm}%,customer_details->>email.ilike.%${filters.searchTerm}%,customer_details->>company.ilike.%${filters.searchTerm}%,customer_details->>message.ilike.%${filters.searchTerm}%`)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error

    const transformedData = await transformEnquiriesWithProducts(data || [])

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiry by ID
export async function getEnquiryById(id) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    const [transformed] = await transformEnquiriesWithProducts([data])

    return { data: transformed || null, error: null }
  } catch (error) {
    console.error('Error fetching enquiry by ID:', error)
    return { data: null, error: error.message }
  }
}

// Update enquiry status
export async function updateEnquiryStatus(id, status) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw error

    const [transformed] = await transformEnquiriesWithProducts(data || [])

    return { data: transformed || null, error: null }
  } catch (error) {
    console.error('Error updating enquiry status:', error)
    return { data: null, error: error.message }
  }
}

// Add a timeline note for an enquiry
export async function addEnquiryNote(enquiryId, status, note) {
  try {
    const payload = {
      enquiry_id: enquiryId,
      status,
      note: note?.trim() ? note.trim() : null
    }

    const { data, error } = await supabase
      .from('enquiry_notes')
      .insert([payload])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error adding enquiry note:', error)
    return { data: null, error: error.message }
  }
}

// Retrieve timeline entries for an enquiry
export async function getEnquiryTimeline(enquiryId) {
  try {
    const { data, error } = await supabase
      .from('enquiry_notes')
      .select('*')
      .eq('enquiry_id', enquiryId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching enquiry timeline:', error)
    return { data: null, error: error.message }
  }
}

// Delete enquiry
export async function deleteEnquiry(id) {
  console.group('deleteEnquiry - Debug Info');
  try {
    console.log('Input ID:', { id, type: typeof id });
    
    if (id === undefined || id === null || id === '') {
      const error = new Error('No enquiry ID provided');
      console.error('Validation Error:', error);
      throw error;
    }

    // Handle different ID formats
    let enquiryId;
    const idStr = String(id).trim();
    console.log('Processed ID string:', { idStr });
    
    // Check if it's a numeric ID
    if (/^\d+$/.test(idStr)) {
      console.log('Numeric ID detected, using as integer');
      enquiryId = parseInt(idStr, 10);
    } 
    // Check if it's a UUID
    else {
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
      const extractedUuid = idStr.match(uuidRegex)?.[0];
      
      if (extractedUuid) {
        console.log('UUID extracted from string:', extractedUuid);
        enquiryId = extractedUuid;
      } else if (uuidRegex.test(idStr)) {
        console.log('Valid UUID format detected');
        enquiryId = idStr;
      } else {
        const error = new Error(`Unrecognized ID format: ${idStr}`);
        console.error('ID Format Error:', error);
        throw error;
      }
    }
    
    console.log('Final enquiry ID to delete:', { enquiryId, type: typeof enquiryId });

    // First, check RLS policies
    console.log('Checking RLS policies...');
    const { data: rlsPolicies, error: rlsError } = await supabase.rpc('get_rls_policies', { table_name: 'enquiries' });
    
    if (rlsError) {
      console.warn('Could not fetch RLS policies. This is normal if the function does not exist.');
      // Continue with the operation
    } else {
      console.log('Current RLS policies for enquiries:', rlsPolicies);
    }

    // Check if the current user has delete permissions
    console.log('Checking user permissions...');
    const { data: userPerms } = await supabase.rpc('current_user_permissions');
    console.log('Current user permissions:', userPerms);

    // First, verify the enquiry exists with more details
    console.log('Checking if enquiry exists...');
    const { data: existingEnquiry, error: fetchError } = await supabase
      .from('enquiries')
      .select('*')
      .eq('id', enquiryId)
      .maybeSingle();

    console.log('Enquiry lookup result:', { 
      id: existingEnquiry?.id,
      created_at: existingEnquiry?.created_at,
      status: existingEnquiry?.status,
      fetchError 
    });

    if (fetchError) {
      console.error('Error checking if enquiry exists:', fetchError);
      throw new Error(`Error checking enquiry: ${fetchError.message}`);
    }

    if (!existingEnquiry) {
      // Get a list of all enquiries to help debug
      console.log('Enquiry not found with direct ID match. Fetching all enquiries...');
      const { data: allEnquiries, error: fetchAllError } = await supabase
        .from('enquiries')
        .select('id, customer_name, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (fetchAllError) {
        console.error('Error fetching all enquiries:', fetchAllError);
      }
      
      console.log('Existing enquiries (first 10):', allEnquiries?.map(e => ({
        id: e.id,
        type: typeof e.id,
        customer: e.customer_name,
        status: e.status,
        created: e.created_at
      })));
      
      // Try to find if the ID exists in any other format
      const allIds = allEnquiries?.map(e => e.id) || [];
      const idAsString = String(enquiryId);
      const idAsNumber = parseInt(idAsString, 10);
      
      const matchingId = allIds.find(id => 
        String(id) === idAsString || 
        (Number.isInteger(idAsNumber) && id === idAsNumber) ||
        String(id).includes(idAsString)
      );
      
      if (matchingId) {
        console.warn(`Found similar ID in database: ${matchingId} (type: ${typeof matchingId})`);
      }
      
      throw new Error(`Enquiry not found. ID: ${enquiryId} (type: ${typeof enquiryId}). Check console for existing enquiries.`);
    }

    // First delete related notes (if any)
    console.log('Deleting related notes...');
    try {
      const { count: notesCount, error: notesError } = await supabase
        .from('enquiry_notes')
        .delete()
        .eq('enquiry_id', enquiryId);

      console.log(`Deleted ${notesCount || 0} related notes`);
      
      if (notesError) {
        console.warn('Warning deleting enquiry notes:', notesError);
      }
    } catch (notesError) {
      console.warn('Error while deleting related notes:', notesError);
      // Continue with enquiry deletion even if notes deletion fails
    }

    // Try primary deletion via database RPC (handles RLS + related cleanup)
    console.log('Attempting to delete via delete_enquiry RPC...');
    const rpcInput = typeof enquiryId === 'string' ? enquiryId : String(enquiryId);
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_enquiry', {
      p_enquiry_id: rpcInput
    });

    console.log('delete_enquiry RPC response:', { rpcResult, rpcError });

    if (!rpcError) {
      // If the RPC executed without an error we'll assume the deletion was successful.
      // Some database functions may not return a payload even on success (returns void),
      // so we treat the absence of an error as success.
      console.log('RPC deletion completed without error; assuming success. Result:', rpcResult);
      console.groupEnd();
      return {
        data: {
          success: true,
          deletedEnquiry: rpcResult || null,
        },
        error: null,
      };
    }

    // Only reach here if the RPC itself returned an error – then attempt direct delete as a fallback.
    if (rpcError?.code !== 'PGRST202') {
      // Log unexpected RPC errors.
      console.warn('RPC delete failed, attempting direct delete fallback:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
      });
    } else {
      // Missing function is expected in some environments; log at info level.
      console.info('delete_enquiry RPC not present; using direct delete.');
    }

    // Try server-side API deletion using service role (bypasses RLS)
    console.log('Falling back to server API delete (service role)...');
    try {
      const response = await fetch(`/api/enquiries?id=${encodeURIComponent(enquiryId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`API delete failed: ${response.status} ${body}`);
      }

      console.log('Server API delete succeeded.');
      console.groupEnd();
      return {
        data: {
          success: true,
          deletedEnquiry: { id: enquiryId },
        },
        error: null,
      };
    } catch (apiErr) {
      console.warn('Server API delete failed, attempting direct client delete fallback:', apiErr);

      // Perform the delete without requesting the deleted row back to prevent RLS SELECT issues.
      const { error: directError } = await supabase
        .from('enquiries')
        .delete()
        .eq('id', enquiryId);

      if (directError) {
        console.error('Direct delete failed:', directError);
        throw new Error(`Delete failed: ${directError.message}`);
      }

      console.log('Direct delete succeeded (no row returned due to RLS).');

      const result = {
        data: {
          success: true,
          deletedEnquiry: { id: enquiryId },
        },
        error: null,
      };

      console.groupEnd();
      return result;
    }
  } catch (error) {
    console.error('Error in deleteEnquiry:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...error
    });
    
    const errorResult = { 
      data: null, 
      error: error.message || 'Failed to delete enquiry' 
    };
    
    console.log('Returning error result:', errorResult);
    console.groupEnd();
    return errorResult;
  }
}

// Get enquiry statistics for dashboard
export async function getEnquiryStats({ startDate, endDate } = {}) {
  try {
    const applyDateFilters = (query) => {
      let filteredQuery = query
      if (startDate) {
        filteredQuery = filteredQuery.gte('created_at', startDate)
      }
      if (endDate) {
        filteredQuery = filteredQuery.lte('created_at', endDate)
      }
      return filteredQuery
    }

    const groupEnquiriesByDate = (enquiries) => {
      if (!Array.isArray(enquiries) || enquiries.length === 0) return []

      const countsByDate = {}

      enquiries.forEach((enquiry) => {
        if (!enquiry?.created_at) return
        const date = new Date(enquiry.created_at).toISOString().split('T')[0]
        countsByDate[date] = (countsByDate[date] || 0) + 1
      })

      return Object.entries(countsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Handle case where enquiries table doesn't exist yet
    let totalEnquiries = 0
    let statusCounts = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 }
    let trendsData = []

    try {
      const totalPromise = applyDateFilters(
        supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
      )

      const statusPromises = STATUS_VALUES.map(async (status) => {
        const { count, error } = await applyDateFilters(
          supabase
            .from('enquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', status)
        )

        if (error) throw error
        return [status, count || 0]
      })

      const trendsQueryPromise = applyDateFilters(
        supabase
          .from('enquiries')
          .select('created_at')
          .order('created_at', { ascending: true })
      )

      const [{ count: totalCount, error: totalError }, statusEntries, { data: trendsQueryData, error: trendsError }] = await Promise.all([
        totalPromise,
        Promise.all(statusPromises),
        trendsQueryPromise
      ])

      if (totalError) throw totalError
      if (trendsError) throw trendsError

      totalEnquiries = totalCount || 0

      statusCounts = statusEntries.reduce((acc, [status, count]) => {
        acc[status] = count
        return acc
      }, {})

      trendsData = groupEnquiriesByDate(trendsQueryData || [])

    } catch (error) {
      console.log('Enquiries table may not exist yet:', error.message)
      // Return default values when table doesn't exist
    }

    // Ensure all statuses have numeric values
    STATUS_VALUES.forEach((status) => {
      if (typeof statusCounts[status] !== 'number') {
        statusCounts[status] = 0
      }
    })

    const conversionRate = totalEnquiries > 0
      ? parseFloat(((statusCounts.won || 0) / totalEnquiries * 100).toFixed(1))
      : 0

    return {
      data: {
        totalEnquiries: totalEnquiries || 0,
        statusCounts,
        trendsData,
        conversionRate
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching enquiry stats:', error)
    return { data: null, error: error.message }
  }
}

// Search enquiries
export async function searchEnquiries(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .or(`customer_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching enquiries:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiries by date range
export async function getEnquiriesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching enquiries by date range:', error)
    return { data: null, error: error.message }
  }
}

// Create new enquiry (for future webhook integration)
export async function createEnquiry(enquiryData) {
  try {
    const { customerDetails, cartItems, ...otherData } = enquiryData
    
    const { data, error } = await supabase
      .from('enquiries')
      .insert([{
        customer_details: customerDetails || {},
        cart_items: cartItems || [],
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...otherData
      }])
      .select()

    if (error) throw error

    const [transformed] = await transformEnquiriesWithProducts(data || [])

    return { data: transformed || null, error: null }
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return { data: null, error: error.message }
  }
}

// Get enquiries by customer email
export async function getEnquiriesByEmail(email, options = {}) {
  try {
    if (!email) {
      return { data: null, error: 'Email is required' }
    }

    const { status = null, limit = null } = options

    let query = supabase
      .from('enquiries')
      .select('*')
      .ilike('customer_details->>email', email)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    const transformedData = await transformEnquiriesWithProducts(data || [])

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching enquiries by email:', error)
    return { data: null, error: error.message }
  }
}
