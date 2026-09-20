const db = require('./config/db');
const { hashPassword } = require('./utils/auth');
const mockRegistry = require('./data/mock_registry.json');

async function resetAndSeed() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    console.log('🔄 Truncating existing tables...');
    // Drop in correct order to respect constraints
    await client.query(`
      TRUNCATE TABLE documents, benefit_requests, schemes, family_members, families, officers, users RESTART IDENTITY CASCADE;
    `);

    console.log('🌱 Seeding Admin...');
    const adminPass = await hashPassword('admin123');
    await client.query(`
      INSERT INTO users (name, email, mobile, password_hash, role) 
      VALUES ('System Admin', 'admin@pravi.gov.in', '9999999999', $1, 'ADMIN')
    `, [adminPass]);

    console.log('🌱 Seeding Officers...');
    const officerPass = await hashPassword('officer123');
    
    // Officer 1 (Ranip)
    const resOff1 = await client.query(`
      INSERT INTO users (name, email, mobile, password_hash, role) 
      VALUES ($1, $2, $3, $4, 'OFFICER') RETURNING id
    `, [mockRegistry[0].name, 'amit.patel@gov.in', '8888888881', officerPass]);
    
    await client.query(`
      INSERT INTO officers (user_id, employee_id, department, designation, village, taluka, district, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
    `, [resOff1.rows[0].id, mockRegistry[0].employee_id, mockRegistry[0].department, mockRegistry[0].designation, mockRegistry[0].village, mockRegistry[0].taluka, mockRegistry[0].district]);

    // Officer 2 (Vastrapur)
    const resOff2 = await client.query(`
      INSERT INTO users (name, email, mobile, password_hash, role) 
      VALUES ($1, $2, $3, $4, 'OFFICER') RETURNING id
    `, [mockRegistry[1].name, 'sunita.sharma@gov.in', '8888888882', officerPass]);
    
    await client.query(`
      INSERT INTO officers (user_id, employee_id, department, designation, village, taluka, district, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'VERIFIED')
    `, [resOff2.rows[0].id, mockRegistry[1].employee_id, mockRegistry[1].department, mockRegistry[1].designation, mockRegistry[1].village, mockRegistry[1].taluka, mockRegistry[1].district]);

    console.log('🌱 Seeding Citizen and Family...');
    const citizenPass = await hashPassword('citizen123');
    const resCit = await client.query(`
      INSERT INTO users (name, email, mobile, password_hash, role) 
      VALUES ('Rahul Parmar', 'rahul@example.com', '7777777777', $1, 'CITIZEN') RETURNING id
    `, [citizenPass]);
    
    const citizenId = resCit.rows[0].id;

    // Insert Family
    const resFam = await client.query(`
      INSERT INTO families (family_id, annual_income, caste, address, village, taluka, district, status, created_by)
      VALUES ('GJ-FAM-2026-000001', 120000.00, 'SEBC', '12, Moti Baug', 'Ranip', 'Ahmedabad City', 'Ahmedabad', 'PENDING_VERIFICATION', $1)
      RETURNING id
    `, [citizenId]);

    const familyId = resFam.rows[0].id;

    // Insert Family Members
    const resMember1 = await client.query(`
      INSERT INTO family_members (family_id, name, age, gender, relationship, occupation, is_student, is_parent_alive)
      VALUES ($1, 'Rahul Parmar', 40, 'Male', 'Self', 'Farmer', false, null) RETURNING id
    `, [familyId]);

    await client.query(`
      INSERT INTO family_members (family_id, name, age, gender, relationship, occupation, is_student, is_parent_alive)
      VALUES ($1, 'Kavita Parmar', 38, 'Female', 'Wife', 'Housewife', false, null)
    `, [familyId]);

    await client.query(`
      INSERT INTO family_members (family_id, name, age, gender, relationship, occupation, is_student, is_parent_alive)
      VALUES ($1, 'Suresh Parmar', 15, 'Male', 'Son', 'Student', true, true)
    `, [familyId]);

    // Update head_member_id in families
    await client.query(`
      UPDATE families SET head_member_id = $1 WHERE id = $2
    `, [resMember1.rows[0].id, familyId]);

    console.log('🌱 Seeding Schemes...');
    const schemes = [
      {
        name: 'Education Support (Demo)',
        description: 'Financial assistance for students from low-income families.',
        criteria: { max_income: 150000, member_rules: [{ is_student: true, min_age: 5, max_age: 25 }] },
        required_documents: ['Income Certificate', 'Student Enrollment Proof', 'Aadhaar Card'],
        source: 'https://demo.gujarat.gov.in/education'
      },
      {
        name: 'Senior Citizen Health Assistance (Demo)',
        description: 'Medical support for elderly citizens.',
        criteria: { max_income: 250000, member_rules: [{ min_age: 60 }] },
        required_documents: ['Age Proof', 'Income Certificate', 'Medical Bill'],
        source: 'https://demo.gujarat.gov.in/health'
      },
      {
        name: 'Housing Assistance (Demo)',
        description: 'Subsidies for building or renovating a house.',
        criteria: { max_income: 120000, caste_allowed: ['SC', 'ST', 'SEBC'] },
        required_documents: ['Income Certificate', 'Caste Certificate', 'Land Ownership Document'],
        source: 'https://demo.gujarat.gov.in/housing'
      },
      {
        name: 'Orphan Child Welfare (Demo)',
        description: 'Monthly stipend and educational support for orphaned children.',
        criteria: { member_rules: [{ is_parent_alive: false, max_age: 18 }] },
        required_documents: ['Death Certificate of Parents', 'Age Proof'],
        source: 'https://demo.gujarat.gov.in/welfare'
      }
    ];

    for (let s of schemes) {
      await client.query(`
        INSERT INTO schemes (name, description, criteria, required_documents, source, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [s.name, s.description, JSON.stringify(s.criteria), JSON.stringify(s.required_documents), s.source, resCit.rows[0].id]);
    }

    await client.query('COMMIT');
    console.log('✅ Database reset and seeded successfully!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', err);
  } finally {
    client.release();
    db.end();
  }
}

resetAndSeed();
