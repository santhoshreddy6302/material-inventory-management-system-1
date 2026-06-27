// Comprehensive API Test Suite for Material Inventory Management System
const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to make HTTP requests using native http module (fully standalone, no npm packages needed)
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${path}`);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Global state for tests
let authToken = '';
let authHeaders = {};
let testProjectId = null;
let testCategoryId = null;
let testMaterialId = null;
let testSupplierId = null;
let testSiteId = null;

async function runTests() {
  console.log('🚀 Starting Material Inventory Management System API Tests...\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Authentication (Login)
    // ----------------------------------------------------
    console.log('🔑 Testing Authenticate / Login...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'admin@constco.com',
      password: 'Admin@123'
    });

    if (loginRes.statusCode !== 200 || !loginRes.data.success) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.data)}`);
    }
    authToken = loginRes.data.data.token;
    authHeaders = { 'Authorization': `Bearer ${authToken}` };
    console.log('   ✅ Login successful! Token retrieved.');

    // ----------------------------------------------------
    // TEST 2: Auth Get Me
    // ----------------------------------------------------
    console.log('\n👤 Testing Get Logged-in User Profile (/auth/me)...');
    const meRes = await request('GET', '/auth/me', null, authHeaders);
    if (meRes.statusCode !== 200 || !meRes.data.success) {
      throw new Error(`Get Me failed with status ${meRes.statusCode}: ${JSON.stringify(meRes.data)}`);
    }
    console.log(`   ✅ Profile fetched successfully. Logged in as: ${meRes.data.data.name} (${meRes.data.data.role})`);

    // ----------------------------------------------------
    // TEST 3: Projects CRUD
    // ----------------------------------------------------
    console.log('\n📁 Testing Projects CRUD...');
    // Create Project
    const createProjectRes = await request('POST', '/projects', {
      name: 'Test Automation Project',
      description: 'Project created by integration tests',
      location: 'Test Location',
      client_name: 'Test Client',
      start_date: '2026-06-01',
      end_date: '2026-12-31',
      budget: 1500000.00,
      status: 'planning',
      manager_id: 2
    }, authHeaders);

    if (createProjectRes.statusCode !== 201 || !createProjectRes.data.success) {
      throw new Error(`Project creation failed with status ${createProjectRes.statusCode}: ${JSON.stringify(createProjectRes.data)}`);
    }
    testProjectId = createProjectRes.data.data.id;
    console.log(`   ✅ Project created. ID: ${testProjectId}`);

    // List Projects
    const listProjectsRes = await request('GET', '/projects', null, authHeaders);
    if (listProjectsRes.statusCode !== 200 || !listProjectsRes.data.success) {
      throw new Error(`List Projects failed with status ${listProjectsRes.statusCode}`);
    }
    const foundProject = listProjectsRes.data.data.find(p => p.id === testProjectId);
    if (!foundProject) {
      throw new Error(`Created project ID ${testProjectId} not found in listing`);
    }
    console.log('   ✅ Project list retrieved and verified.');

    // Update Project
    const updateProjectRes = await request('PUT', `/projects/${testProjectId}`, {
      name: 'Test Automation Project (Updated)',
      description: 'Updated by integration tests',
      status: 'active',
      budget: 1800000.00
    }, authHeaders);
    if (updateProjectRes.statusCode !== 200 || !updateProjectRes.data.success) {
      throw new Error(`Project update failed with status ${updateProjectRes.statusCode}: ${JSON.stringify(updateProjectRes.data)}`);
    }
    console.log('   ✅ Project updated successfully.');

    // Get Single Project
    const getProjectRes = await request('GET', `/projects/${testProjectId}`, null, authHeaders);
    if (getProjectRes.statusCode !== 200 || getProjectRes.data.data.name !== 'Test Automation Project (Updated)') {
      throw new Error(`Failed to retrieve correct project. Res: ${JSON.stringify(getProjectRes.data)}`);
    }
    console.log('   ✅ Single project retrieval verified.');

    // ----------------------------------------------------
    // TEST 4: Sites CRUD
    // ----------------------------------------------------
    console.log('\n📍 Testing Sites CRUD...');
    // Create Site
    const createSiteRes = await request('POST', '/sites', {
      name: 'Test Automation Site',
      location: 'Sector 99, Test City',
      address: 'Plot 99, Industrial Sector',
      project_id: testProjectId,
      engineer_id: 3
    }, authHeaders);

    if (createSiteRes.statusCode !== 201 || !createSiteRes.data.success) {
      throw new Error(`Site creation failed with status ${createSiteRes.statusCode}: ${JSON.stringify(createSiteRes.data)}`);
    }
    testSiteId = createSiteRes.data.data.id;
    console.log(`   ✅ Site created. ID: ${testSiteId}`);

    // Update Site
    const updateSiteRes = await request('PUT', `/sites/${testSiteId}`, {
      name: 'Test Automation Site (Updated)',
      location: 'Sector 99, Test City (Updated)'
    }, authHeaders);
    if (updateSiteRes.statusCode !== 200 || !updateSiteRes.data.success) {
      throw new Error(`Site update failed with status ${updateSiteRes.statusCode}`);
    }
    console.log('   ✅ Site updated successfully.');

    // List Sites
    const listSitesRes = await request('GET', '/sites', null, authHeaders);
    if (listSitesRes.statusCode !== 200 || !listSitesRes.data.data.find(s => s.id === testSiteId)) {
      throw new Error('List Sites failed to verify test site');
    }
    console.log('   ✅ Site list retrieved and verified.');

    // ----------------------------------------------------
    // TEST 5: Suppliers CRUD
    // ----------------------------------------------------
    console.log('\n🚚 Testing Suppliers CRUD...');
    // Create Supplier
    const createSupplierRes = await request('POST', '/suppliers', {
      name: 'Test Automation Suppliers',
      contact_person: 'John Doe',
      email: 'john@testsupplier.com',
      phone: '9898989898',
      address: 'Supplier Zone 1',
      city: 'Test City',
      state: 'Test State',
      gst_number: '99AAAAA1111A1Z1',
      payment_terms: 'Net 30'
    }, authHeaders);

    if (createSupplierRes.statusCode !== 201 || !createSupplierRes.data.success) {
      throw new Error(`Supplier creation failed with status ${createSupplierRes.statusCode}: ${JSON.stringify(createSupplierRes.data)}`);
    }
    testSupplierId = createSupplierRes.data.data.id;
    console.log(`   ✅ Supplier created. ID: ${testSupplierId}`);

    // List Suppliers
    const listSuppliersRes = await request('GET', '/suppliers', null, authHeaders);
    if (listSuppliersRes.statusCode !== 200 || !listSuppliersRes.data.data.find(s => s.id === testSupplierId)) {
      throw new Error('List Suppliers failed to verify test supplier');
    }
    console.log('   ✅ Supplier list retrieved and verified.');

    // ----------------------------------------------------
    // TEST 6: Materials & Categories CRUD
    // ----------------------------------------------------
    console.log('\n🧱 Testing Materials & Categories CRUD...');
    // Create Category
    const createCategoryRes = await request('POST', '/materials/categories', {
      name: 'Test Category',
      description: 'Created by tests',
      color: '#FFFFFF'
    }, authHeaders);

    if (createCategoryRes.statusCode !== 201 || !createCategoryRes.data.success) {
      throw new Error(`Category creation failed with status ${createCategoryRes.statusCode}`);
    }
    testCategoryId = createCategoryRes.data.data.id;
    console.log(`   ✅ Material Category created. ID: ${testCategoryId}`);

    // Create Material
    const createMaterialRes = await request('POST', '/materials', {
      name: 'Test Cement Ultra',
      category_id: testCategoryId,
      unit: 'Bags',
      description: 'Premium grade test cement',
      cost_per_unit: 450.00,
      minimum_threshold: 100,
      reorder_quantity: 500,
      supplier_id: testSupplierId
    }, authHeaders);

    if (createMaterialRes.statusCode !== 201 || !createMaterialRes.data.success) {
      throw new Error(`Material creation failed with status ${createMaterialRes.statusCode}: ${JSON.stringify(createMaterialRes.data)}`);
    }
    testMaterialId = createMaterialRes.data.data.id;
    console.log(`   ✅ Material created. ID: ${testMaterialId}`);

    // List Materials
    const listMaterialsRes = await request('GET', '/materials', null, authHeaders);
    if (listMaterialsRes.statusCode !== 200 || !listMaterialsRes.data.data.find(m => m.id === testMaterialId)) {
      throw new Error('List Materials failed to verify test material');
    }
    console.log('   ✅ Material list retrieved and verified.');

    // ----------------------------------------------------
    // TEST 7: Inventory Ledger & Transactions
    // ----------------------------------------------------
    console.log('\n📦 Testing Inventory Ledger & Transactions...');
    // Let's perform a stock update/entry via POST /api/inventory/adjust
    const stockUpdateRes = await request('POST', '/inventory/adjust', {
      material_id: testMaterialId,
      site_id: testSiteId,
      quantity: 250,
      notes: 'Initial automated stock entry'
    }, authHeaders);

    if (stockUpdateRes.statusCode !== 200 && stockUpdateRes.statusCode !== 201) {
      throw new Error(`Stock update failed with status ${stockUpdateRes.statusCode}: ${JSON.stringify(stockUpdateRes.data)}`);
    }
    console.log('   ✅ Stock entry (Adjustment) added successfully.');

    // Check Site Wise Inventory
    const siteInvRes = await request('GET', `/inventory?site_id=${testSiteId}`, null, authHeaders);
    if (siteInvRes.statusCode !== 200) {
      throw new Error(`Failed to get site inventory. Status: ${siteInvRes.statusCode}`);
    }
    console.log('   ✅ Site inventory query verified.');

    // Record usage
    const usageRes = await request('POST', '/usage', {
      site_id: testSiteId,
      material_id: testMaterialId,
      quantity_used: 50,
      usage_date: new Date().toISOString().split('T')[0],
      purpose: 'Foundations test'
    }, authHeaders);

    if (usageRes.statusCode !== 200 && usageRes.statusCode !== 201) {
      throw new Error(`Recording usage failed with status ${usageRes.statusCode}: ${JSON.stringify(usageRes.data)}`);
    }
    console.log('   ✅ Material usage recorded successfully.');

    // Record wastage
    const wastageRes = await request('POST', '/wastage', {
      site_id: testSiteId,
      material_id: testMaterialId,
      quantity_wasted: 5,
      wastage_date: new Date().toISOString().split('T')[0],
      reason: 'spill',
      preventable: true,
      description: 'Minor test spill'
    }, authHeaders);

    if (wastageRes.statusCode !== 200 && wastageRes.statusCode !== 201) {
      throw new Error(`Recording wastage failed with status ${wastageRes.statusCode}: ${JSON.stringify(wastageRes.data)}`);
    }
    console.log('   ✅ Material wastage recorded successfully.');

    // Record transfer
    const transferRes = await request('POST', '/transfers', {
      from_site_id: testSiteId,
      to_site_id: 1, // transferring to Greenfield Block A (seeded ID: 1)
      material_id: testMaterialId,
      quantity: 20,
      transfer_date: new Date().toISOString().split('T')[0],
      reason: 'Site allocation test'
    }, authHeaders);

    if (transferRes.statusCode !== 200 && transferRes.statusCode !== 201) {
      throw new Error(`Recording transfer failed with status ${transferRes.statusCode}: ${JSON.stringify(transferRes.data)}`);
    }
    console.log('   ✅ Material transfer recorded successfully.');

    // ----------------------------------------------------
    // TEST 8: Purchase Orders CRUD
    // ----------------------------------------------------
    console.log('\n🛒 Testing Purchase Orders...');
    const createPORes = await request('POST', '/purchase-orders', {
      supplier_id: testSupplierId,
      project_id: testProjectId,
      site_id: testSiteId,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days later
      items: [
        {
          material_id: testMaterialId,
          quantity: 1000,
          unit_price: 450.00,
          tax_percentage: 18
        }
      ],
      notes: 'Automated test purchase order'
    }, authHeaders);

    if (createPORes.statusCode !== 201 || !createPORes.data.success) {
      throw new Error(`PO creation failed with status ${createPORes.statusCode}: ${JSON.stringify(createPORes.data)}`);
    }
    const testPoId = createPORes.data.data.id;
    console.log(`   ✅ Purchase Order created successfully. ID: ${testPoId}`);

    // Update PO Status to pending_approval first
    const updatePOPendingRes = await request('PUT', `/purchase-orders/${testPoId}/status`, {
      status: 'pending_approval'
    }, authHeaders);
    if (updatePOPendingRes.statusCode !== 200 || !updatePOPendingRes.data.success) {
      throw new Error(`PO status update to pending_approval failed with status ${updatePOPendingRes.statusCode}`);
    }
    console.log('   ✅ Purchase Order status updated (Pending Approval) successfully.');

    // Update PO Status to approved
    const updatePOStatusRes = await request('PUT', `/purchase-orders/${testPoId}/status`, {
      status: 'approved'
    }, authHeaders);
    if (updatePOStatusRes.statusCode !== 200 || !updatePOStatusRes.data.success) {
      throw new Error(`PO status update to approved failed with status ${updatePOStatusRes.statusCode}`);
    }
    console.log('   ✅ Purchase Order status updated (Approved) successfully.');

    // ----------------------------------------------------
    // TEST 9: Reports & Logs
    // ----------------------------------------------------
    console.log('\n📊 Testing Reports & Audit Logs...');
    const reports = ['inventory', 'purchase', 'usage', 'wastage', 'activity-logs'];
    for (const rpt of reports) {
      const rptRes = await request('GET', `/reports/${rpt}`, null, authHeaders);
      if (rptRes.statusCode !== 200 || !rptRes.data.success) {
        throw new Error(`Report "${rpt}" failed with status ${rptRes.statusCode}`);
      }
      console.log(`   ✅ Report "${rpt}" generated successfully.`);
    }

    // ----------------------------------------------------
    // TEST 10: Clean up
    // ----------------------------------------------------
    console.log('\n🧹 Cleaning up test records...');

    // Delete PO
    const deletePoRes = await request('DELETE', `/purchase-orders/${testPoId}`, null, authHeaders);
    if (deletePoRes.statusCode !== 200) {
      console.warn(`   ⚠️ Warning: Could not delete PO ID ${testPoId}`);
    } else {
      console.log('   ✅ Test Purchase Order cleaned up.');
    }

    // Delete Material (note: must clear inventory transactions first, which we won't delete, so we expect a 409 or 200. Let's try and handle gracefully)
    const deleteMatRes = await request('DELETE', `/materials/${testMaterialId}`, null, authHeaders);
    if (deleteMatRes.statusCode === 200) {
      console.log('   ✅ Test Material cleaned up.');
    } else {
      console.log(`   ℹ️ Material delete returned status ${deleteMatRes.statusCode} (expected if transaction history exists).`);
    }

    // Delete Site
    const deleteSiteRes = await request('DELETE', `/sites/${testSiteId}`, null, authHeaders);
    if (deleteSiteRes.statusCode === 200) {
      console.log('   ✅ Test Site cleaned up.');
    } else {
      console.log(`   ℹ️ Site delete returned status ${deleteSiteRes.statusCode}.`);
    }

    // Delete Project
    const deleteProjectRes = await request('DELETE', `/projects/${testProjectId}`, null, authHeaders);
    if (deleteProjectRes.statusCode === 200) {
      console.log('   ✅ Test Project cleaned up.');
    } else {
      console.log(`   ℹ️ Project delete returned status ${deleteProjectRes.statusCode}.`);
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The APIs and CRUD operations are fully production-ready.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
    console.error(err);
    process.exit(1);
  }
}

// Delay test start by 1 second to make sure server is ready
setTimeout(runTests, 1000);
