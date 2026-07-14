let rawBase = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5000';
if (!rawBase.endsWith('/api/v1')) {
  rawBase = rawBase.replace(/\/+$/, '') + '/api/v1';
}
const BASE_URL = rawBase;

async function testWorkflow() {
  console.log('🏁 Starting comprehensive end-to-end integration tests...');

  // Helper function to assert statuses
  const assertStatus = (res, expectedStatus, message) => {
    if (res.status !== expectedStatus) {
      throw new Error(`${message}: Expected status ${expectedStatus}, but got ${res.status}`);
    }
  };

  // 1. Initial login to get Master Admin Token
  console.log('\n🔐 Initializing: Authenticating Master Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@society.com', password: 'Admin@123' }),
  });
  assertStatus(adminLoginRes, 200, 'Master Admin authentication failed');
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data.token;
  console.log('✅ Master Admin authenticated successfully.');

  // ==========================================
  // PHASE 1: Authentication & Account Management Lifecycle
  // ==========================================
  console.log('\n=== PHASE 1: Authentication & Account Management ===');

  // Step 1: Register new standard resident user
  const tempUserEmail = `user-${Date.now()}@test.com`;
  console.log(`➡️  Step 1: Registering user ${tempUserEmail}...`);
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tempUserEmail,
      password: 'Resident@123',
      firstName: 'Temp',
      lastName: 'User',
      role: 'RESIDENT',
    }),
  });
  assertStatus(registerRes, 201, 'User registration failed');
  const registerData = await registerRes.json();
  const tempUserId = registerData.data.user.id;
  console.log(`✅ User registered successfully. ID: ${tempUserId}`);

  // Step 2: Forgot Password Flow
  console.log('➡️  Step 2: Triggering forgot-password...');
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tempUserEmail }),
  });
  assertStatus(forgotRes, 200, 'Forgot password request failed');
  const forgotData = await forgotRes.json();
  const resetToken = forgotData.data.resetToken;
  if (!resetToken) {
    throw new Error('Forgot password response did not contain resetToken');
  }
  console.log('✅ Forgot password reset token generated.');

  // Step 3: Reset Password Flow
  console.log('➡️  Step 3: Triggering reset-password...');
  const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken, newPassword: 'Resident@1234' }),
  });
  assertStatus(resetRes, 200, 'Reset password flow failed');
  console.log('✅ Password reset completed successfully.');

  // Step 4: Login with newly reset password
  console.log('➡️  Step 4: Logging in with reset password...');
  const tempLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tempUserEmail, password: 'Resident@1234' }),
  });
  assertStatus(tempLoginRes, 200, 'Login with reset password failed');
  const tempLoginData = await tempLoginRes.json();
  const tempUserToken = tempLoginData.data.token;
  console.log('✅ Logged in successfully with reset password.');

  // Step 5: Change Password Flow (authenticated)
  console.log('➡️  Step 5: Testing change-password...');
  const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tempUserToken}`,
    },
    body: JSON.stringify({ currentPassword: 'Resident@1234', newPassword: 'Resident@123' }),
  });
  assertStatus(changeRes, 200, 'Change password failed');
  console.log('✅ Change password completed.');

  // Step 6: Verify login with final password
  console.log('➡️  Step 6: Final check - Logging in with changed password...');
  const finalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: tempUserEmail, password: 'Resident@123' }),
  });
  assertStatus(finalLoginRes, 200, 'Login with changed password failed');
  const finalLoginData = await finalLoginRes.json();
  const finalUserToken = finalLoginData.data.token;
  console.log('✅ Login successful. Final user session token saved.');

  // ==========================================
  // PHASE 2: Structural Onboarding & Role Changes
  // ==========================================
  console.log('\n=== PHASE 2: Structural Onboarding & Role Changes ===');

  // Step 1: Lookup Flats
  console.log('➡️  Step 1: Listing flats...');
  const flatsRes = await fetch(`${BASE_URL}/flats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(flatsRes, 200, 'Failed to fetch flats');
  const flatsData = await flatsRes.json();
  const flatId = flatsData.data.flats[0].id;
  console.log(`✅ Flat found: ${flatsData.data.flats[0].block} - ${flatsData.data.flats[0].number} (ID: ${flatId})`);

  // Step 2: Onboard a resident profile (creates a separate active resident user)
  const residentEmail = `resident-${Date.now()}@society.com`;
  console.log(`➡️  Step 2: Onboarding resident profile for ${residentEmail}...`);
  const onboardRes = await fetch(`${BASE_URL}/residents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: residentEmail,
      password: 'Resident@123',
      firstName: 'Onboarded',
      lastName: 'Resident',
      phone: '1234567890',
      flatId: flatId,
      status: 'OWNER',
    }),
  });
  if (onboardRes.status !== 201) {
    console.error('Resident onboarding failed details:', await onboardRes.text());
  }
  assertStatus(onboardRes, 201, 'Resident onboarding failed');
  const onboardData = await onboardRes.json();
  const onboardProfileId = onboardData.data.resident.id;
  console.log(`✅ Onboarded Resident Profile ID: ${onboardProfileId}`);

  // Step 3: Promote standard user (from Phase 1) to COMMITTEE
  console.log('➡️  Step 3: Promoting user to Committee role...');
  const promoteRes = await fetch(`${BASE_URL}/committee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      userId: tempUserId,
      responsibility: 'Treasury Officer',
    }),
  });
  assertStatus(promoteRes, 201, 'Committee promotion failed');
  const promoteData = await promoteRes.json();
  const committeeProfileId = promoteData.data.committee.id;
  console.log(`✅ Committee Profile promoted. ID: ${committeeProfileId}`);

  // Step 4: Alter committee member responsibility
  console.log('➡️  Step 4: Patching committee responsibility...');
  const patchCommRes = await fetch(`${BASE_URL}/committee/${committeeProfileId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ responsibility: 'Senior Treasury Manager' }),
  });
  assertStatus(patchCommRes, 200, 'Committee responsibility update failed');
  console.log('✅ Committee responsibility updated successfully.');

  // Step 5: Downgrade committee member back to Resident
  console.log('➡️  Step 5: Downgrading committee member...');
  const demoteRes = await fetch(`${BASE_URL}/committee/${committeeProfileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(demoteRes, 200, 'Committee demotion failed');
  console.log('✅ Committee member demoted back to RESIDENT successfully.');

  // Step 6: Soft Delete the Onboarded Resident Profile
  console.log('➡️  Step 6: Deactivating onboarded resident profile...');
  const deleteRes = await fetch(`${BASE_URL}/residents/${onboardProfileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(deleteRes, 200, 'Resident profile deletion failed');

  // Verify profile state is 'LEFT' and User.isActive is false
  const verifyRes = await fetch(`${BASE_URL}/residents/${onboardProfileId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(verifyRes, 200, 'Failed to fetch resident profile for verification');
  const verifyData = await verifyRes.json();
  const residentRecord = verifyData.data.resident;
  if (residentRecord.status !== 'LEFT' || residentRecord.user.isActive !== false) {
    throw new Error(`Soft delete check failed: Status is ${residentRecord.status}, isActive is ${residentRecord.user.isActive}`);
  }
  console.log('✅ Resident soft-delete verified successfully (status: LEFT, isActive: false).');

  // ==========================================
  // PHASE 3: Operational Workflows (Complaints & Requests)
  // ==========================================
  console.log('\n=== PHASE 3: Operational Workflows (Complaints & Requests) ===');

  // Setup separate authentications
  // A. Authenticate as the Onboarded Resident (who is active!)
  // Wait, the previous resident was soft deleted (isActive = false). Let's onboard a brand new Resident for active operations!
  const activeResidentEmail = `active-resident-${Date.now()}@society.com`;
  console.log(`➡️  Setting up active resident user: ${activeResidentEmail}...`);
  const activeOnboardRes = await fetch(`${BASE_URL}/residents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: activeResidentEmail,
      password: 'Resident@123',
      firstName: 'Active',
      lastName: 'Resident',
      phone: '5555555555',
      flatId: flatId,
      status: 'OWNER',
    }),
  });
  assertStatus(activeOnboardRes, 201, 'Active resident onboarding failed');
  const activeOnboardData = await activeOnboardRes.json();

  // Login as active resident
  const resLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: activeResidentEmail, password: 'Resident@123' }),
  });
  assertStatus(resLoginRes, 200, 'Active resident login failed');
  const resLoginData = await resLoginRes.json();
  const residentToken = resLoginData.data.token;
  const residentUserId = resLoginData.data.user.id;

  // B. Onboard and promote a Committee Member
  const committeeEmail = `committee-ops-${Date.now()}@society.com`;
  console.log(`➡️  Setting up committee operations user: ${committeeEmail}...`);
  const commRegisterRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: committeeEmail,
      password: 'Committee@123',
      firstName: 'Comm',
      lastName: 'Ops',
      role: 'COMMITTEE',
    }),
  });
  assertStatus(commRegisterRes, 201, 'Committee registration failed');
  const commRegisterData = await commRegisterRes.json();
  const commUserId = commRegisterData.data.user.id;

  // Link profile
  const commPromoteRes = await fetch(`${BASE_URL}/committee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      userId: commUserId,
      responsibility: 'Maintenance Lead',
    }),
  });
  assertStatus(commPromoteRes, 201, 'Committee promote failed');

  // Login as committee
  const commLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: committeeEmail, password: 'Committee@123' }),
  });
  assertStatus(commLoginRes, 200, 'Committee login failed');
  const commLoginData = await commLoginRes.json();
  const committeeToken = commLoginData.data.token;

  // C. Setup another Resident user as the unauthorized third-party
  const intruderEmail = `intruder-${Date.now()}@society.com`;
  const intruderRegisterRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: intruderEmail,
      password: 'Intruder@123',
      firstName: 'Bad',
      lastName: 'Intruder',
      role: 'RESIDENT',
    }),
  });
  assertStatus(intruderRegisterRes, 201, 'Intruder registration failed');
  const intruderLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: intruderEmail, password: 'Intruder@123' }),
  });
  assertStatus(intruderLoginRes, 200, 'Intruder login failed');
  const intruderLoginData = await intruderLoginRes.json();
  const intruderToken = intruderLoginData.data.token;

  // Step 1: Resident creates complaint with multipart file mock
  console.log('➡️  Step 1: Resident raising a complaint with file stream attachment...');
  const formData = new FormData();
  formData.append('title', 'Broken elevator lift lights');
  formData.append('description', 'The elevator lights are flickering constantly.');
  formData.append('category', 'ELECTRICAL');

  // Create a valid 1x1 transparent PNG binary blob in-memory
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const byteCharacters = atob(pngBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const fileBlob = new Blob([byteArray], { type: 'image/png' });
  formData.append('image', fileBlob, 'elevator.png');

  const complaintCreateRes = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${residentToken}` },
    body: formData,
  });
  if (complaintCreateRes.status !== 201) {
    const errorBody = await complaintCreateRes.text();
    throw new Error(`Complaint creation failed: Expected status 201, but got ${complaintCreateRes.status}. Error body: ${errorBody}`);
  }
  const complaintCreateData = await complaintCreateRes.json();
  const complaintId = complaintCreateData.data.complaint.id;
  console.log(`✅ Complaint registered successfully. ID: ${complaintId}`);

  // Step 2: Admin assigns the complaint to the committee member
  console.log(`➡️  Step 2: Admin assigning complaint ${complaintId} to committee user ${commUserId}...`);
  const assignRes = await fetch(`${BASE_URL}/complaints/${complaintId}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assignedToId: commUserId }),
  });
  assertStatus(assignRes, 200, 'Complaint assignment failed');
  console.log('✅ Complaint assigned successfully.');

  // Step 3: Dialogue Threading - Resident Comments
  console.log('➡️  Step 3: Resident posting comment on complaint thread...');
  const residentCommentRes = await fetch(`${BASE_URL}/complaints/${complaintId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
    },
    body: JSON.stringify({ comment: 'Please resolve this before the weekend.' }),
  });
  assertStatus(residentCommentRes, 201, 'Resident comment post failed');

  // Dialogue Threading - Committee Comments
  console.log('➡️  Step 3b: Assigned Committee member posting comment on thread...');
  const committeeCommentRes = await fetch(`${BASE_URL}/complaints/${complaintId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${committeeToken}`,
    },
    body: JSON.stringify({ comment: 'On it, scheduled inspector visits tomorrow morning.' }),
  });
  assertStatus(committeeCommentRes, 201, 'Committee comment post failed');

  // Dialogue Threading - Intruder Blocked Check
  console.log('➡️  Step 3c: Checking that unauthorized resident is blocked from commenting...');
  const intruderCommentRes = await fetch(`${BASE_URL}/complaints/${complaintId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${intruderToken}`,
    },
    body: JSON.stringify({ comment: 'Spamming other residents threads.' }),
  });
  assertStatus(intruderCommentRes, 403, 'Intruder check failed: Expected 403 Forbidden for unauthorized comment');
  console.log('✅ Dialog threading and intruder block checks passed.');

  // Step 4: Service Request state machine workflow
  console.log('➡️  Step 4: Resident raising a service request...');
  const requestCreateRes = await fetch(`${BASE_URL}/service-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
    },
    body: JSON.stringify({
      title: 'Water tap leaking',
      description: 'The kitchen sink tap is dripping constantly.',
      category: 'Water Supply',
    }),
  });
  assertStatus(requestCreateRes, 201, 'Service request creation failed');
  const requestCreateData = await requestCreateRes.json();
  const requestId = requestCreateData.data.serviceRequest.id;
  console.log(`✅ Service Request registered. ID: ${requestId}`);

  // Test Out-Of-Order state machine action (resolve PENDING should fail)
  console.log('➡️  Step 4b: Verifying out-of-order transition (resolve of PENDING request) is blocked...');
  const badResolveRes = await fetch(`${BASE_URL}/service-requests/${requestId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${committeeToken}`,
    },
  });
  assertStatus(badResolveRes, 400, 'Out of order state resolve test failed (expected 400)');

  // Committee reviews request -> APPROVED
  console.log('➡️  Step 4c: Committee approving the service request...');
  const reviewRes = await fetch(`${BASE_URL}/service-requests/${requestId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${committeeToken}`,
    },
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  assertStatus(reviewRes, 200, 'Committee review failed');

  // Test Out-Of-Order feedback submission (feedback on APPROVED should fail)
  console.log('➡️  Step 4d: Verifying feedback submission on APPROVED request is blocked...');
  const badFeedbackRes = await fetch(`${BASE_URL}/service-requests/${requestId}/feedback`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
    },
    body: JSON.stringify({ feedback: 'Good job!' }),
  });
  assertStatus(badFeedbackRes, 400, 'Out of order feedback test failed (expected 400)');

  // Committee resolves request -> COMPLETED
  console.log('➡️  Step 4e: Committee marking the service request as resolved...');
  const resolveRes = await fetch(`${BASE_URL}/service-requests/${requestId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${committeeToken}`,
    },
  });
  assertStatus(resolveRes, 200, 'Committee resolve failed');

  // Resident submits feedback
  console.log('➡️  Step 4f: Resident submitting final feedback...');
  const feedbackRes = await fetch(`${BASE_URL}/service-requests/${requestId}/feedback`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${residentToken}`,
    },
    body: JSON.stringify({ feedback: 'Tap replaced, leakage stopped. Excellent speed!' }),
  });
  assertStatus(feedbackRes, 200, 'Resident feedback submit failed');
  console.log('✅ Service Request state machine lifecycle completed.');

  // ==========================================
  // PHASE 4: Financial Ledger Controls
  // ==========================================
  console.log('\n=== PHASE 4: Financial Ledger Controls ===');

  // Step 1: Admin generates baseline bills for a new month to ensure fresh unpaid bills
  const randMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const billingMonth = `2027-${randMonth}`;
  console.log(`➡️  Step 1: Admin generating maintenance bills for period ${billingMonth}...`);
  const billGenRes = await fetch(`${BASE_URL}/bills/batch-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      amount: 2000,
      billingMonth: billingMonth,
      dueDate: new Date('2027-08-01').toISOString(),
    }),
  });
  assertStatus(billGenRes, 200, 'Failed to generate initial bills');
  console.log('✅ Batch generation successful.');

  // Fetch unpaid bills
  const fetchUnpaidRes = await fetch(`${BASE_URL}/bills?status=UNPAID`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(fetchUnpaidRes, 200, 'Failed to fetch bills ledger');
  const fetchUnpaidData = await fetchUnpaidRes.json();
  const unpaidBill = fetchUnpaidData.bills.find(b => b.flatId === flatId && b.billingPeriod === billingMonth) || fetchUnpaidData.bills[0];
  if (!unpaidBill) {
    throw new Error('No unpaid bill found for flat to verify ledger operations');
  }

  // Step 2: Admin appends penalty fee
  console.log(`➡️  Step 2: Admin appending penalty fee to bill ${unpaidBill.id}...`);
  const penaltyRes = await fetch(`${BASE_URL}/bills/${unpaidBill.id}/penalty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ penaltyAmount: 250 }),
  });
  assertStatus(penaltyRes, 200, 'Penalty assignment failed');
  console.log('✅ Late fee penalty appended.');

  // Step 3: Verify single bill details
  console.log(`➡️  Step 3: Checking single bill info for bill ${unpaidBill.id}...`);
  const singleBillRes = await fetch(`${BASE_URL}/bills/${unpaidBill.id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(singleBillRes, 200, 'Failed to query single bill');
  const singleBillData = await singleBillRes.json();
  if (singleBillData.data.bill.penalty !== 250) {
    throw new Error(`Penalty verify failed: expected 250, got ${singleBillData.data.bill.penalty}`);
  }
  console.log('✅ Single bill details verified.');

  // Step 4: Record cash reconciliation
  console.log(`➡️  Step 4: Recording cash settlement against bill ${unpaidBill.id}...`);
  const recordPayRes = await fetch(`${BASE_URL}/bills/${unpaidBill.id}/record-cash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      amountPaid: 2250, // base 2000 + penalty 250
      paidByName: 'Test Payee',
      discount: 0,
    }),
  });
  assertStatus(recordPayRes, 201, 'Cash payment collection failed');

  // Step 5: Verify receipt generation
  console.log(`➡️  Step 5: Fetching receipt details for bill ${unpaidBill.id}...`);
  const receiptRes = await fetch(`${BASE_URL}/bills/${unpaidBill.id}/receipt`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(receiptRes, 200, 'Receipt check failed');
  const receiptData = await receiptRes.json();
  console.log(`✅ Receipt successfully fetched: ${receiptData.data.receipt.receiptNumber}`);

  // ==========================================
  // PHASE 5: Dashboards, Analytical Reporting & Auditing
  // ==========================================
  console.log('\n=== PHASE 5: Dashboards, Analytical Reporting & Auditing ===');

  // Step 1: Sequential role summary calls
  console.log('➡️  Step 1: Fetching ADMIN dashboard summary...');
  const dashAdminRes = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(dashAdminRes, 200, 'ADMIN dashboard fetch failed');
  const dashAdminData = await dashAdminRes.json();
  if (dashAdminData.data.activeResidents === undefined) {
    throw new Error('ADMIN dashboard summary response formatting invalid');
  }

  console.log('➡️  Step 1b: Fetching COMMITTEE dashboard summary...');
  const dashCommRes = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${committeeToken}` },
  });
  assertStatus(dashCommRes, 200, 'COMMITTEE dashboard fetch failed');
  const dashCommData = await dashCommRes.json();
  if (dashCommData.data.totalPendingComplaints === undefined) {
    throw new Error('COMMITTEE dashboard summary response formatting invalid');
  }

  console.log('➡️  Step 1c: Fetching RESIDENT dashboard summary...');
  const dashResRes = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { 'Authorization': `Bearer ${residentToken}` },
  });
  assertStatus(dashResRes, 200, 'RESIDENT dashboard fetch failed');
  const dashResData = await dashResRes.json();
  if (dashResData.data.outstandingBalance === undefined) {
    throw new Error('RESIDENT dashboard summary response formatting invalid');
  }
  console.log('✅ Dashboard summaries successfully checked for all roles.');

  // Step 2: Financial report check
  console.log('➡️  Step 2: Checking financial performance reports...');
  const reportFinRes = await fetch(`${BASE_URL}/reports/finance`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(reportFinRes, 200, 'Finance reports fetch failed');
  const reportFinData = await reportFinRes.json();
  if (!Array.isArray(reportFinData.data?.report)) {
    throw new Error('Finance report response layout invalid');
  }

  // Operations report check
  console.log('➡️  Step 2b: Checking operational performance reports...');
  const reportOpsRes = await fetch(`${BASE_URL}/reports/operations`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(reportOpsRes, 200, 'Operations reports fetch failed');
  const reportOpsData = await reportOpsRes.json();
  if (reportOpsData.data?.report?.totalComplaintsRaised === undefined) {
    throw new Error('Operations report response layout invalid');
  }
  console.log('✅ Cross-Domain reports verified.');

  // Step 3: Searchable & Paginated System Audit Logs
  console.log('➡️  Step 3: Checking append-only system audit log viewing...');
  const auditRes = await fetch(`${BASE_URL}/audit-logs?page=1&limit=10&action=COMPLAINT_CREATE`, {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertStatus(auditRes, 200, 'Audit logs fetch failed');
  const auditData = await auditRes.json();
  if (auditData.logs === undefined || auditData.total === undefined) {
    throw new Error('Audit logs response layout invalid');
  }
  console.log(`✅ System Audit Log verified. Active log records found: ${auditData.total}`);

  console.log('\n🎉 ALL CORE API ROUTES AND LIFECYCLES PASSED INTEGRATION VALIDATION SUCCESSFULLY! 🎉');
}

testWorkflow().catch((err) => {
  console.error('\n❌ INTEGRATION TEST PIPELINE ENCOUNTERED A FAILURE:', err.message);
  process.exit(1);
});
