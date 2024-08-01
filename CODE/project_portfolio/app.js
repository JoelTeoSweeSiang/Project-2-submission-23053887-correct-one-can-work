
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
const app = express();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Append extension
  }
});
const upload = multer({ storage: storage });

// Create database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'profilezen2'
});

// Connect to the database
connection.connect((error) => {
  if (error) {
    console.error('Database connection error: ', error);
    return;
  }
  console.log('Connected to the MySQL server.');
});

// Set up EJS for templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route to display profiles
app.get('/', (req, res) => {
  const sql = 'SELECT * FROM profiles';
  connection.query(sql, (error, results) => {
    if (error) {
      console.error('Database query error: ', error.message);
      return res.status(500).send('Error retrieving profiles');
    }
    res.render('mainpage', { profiles: results });
  });
});

// Route to show the profile addition form
app.get('/add_profile', (req, res) => {
  res.render('add_profile');
});

// Route to handle profile addition and redirect to add skills
app.post('/add-profile', upload.single('picture_path'), (req, res) => {
  const { name, phoneNumber, address, email } = req.body;
  const picturePath = req.file ? req.file.path : ''; // Handle the file path

  const sql = 'INSERT INTO profiles (name, picture_path, phone_number, address, email) VALUES (?, ?, ?, ?, ?)';
  connection.query(sql, [name, picturePath, phoneNumber, address, email], (error, results) => {
    if (error) {
      console.error('Error inserting profile into database:', error);
      return res.status(500).send('Error adding profile');
    }
    const profileId = results.insertId;
    res.redirect(`/add_skills?profileId=${profileId}`);
  });
});

// Route to show the skills addition form
app.get('/add_skills', (req, res) => {
  const profileId = req.query.profileId;
  res.render('add_skills', { profileId });
});

// Route to handle skills addition and redirect to add employment
app.post('/submit-skills', upload.single('qualification_image'), (req, res) => {
  const {
    profile_id,
    skill_level,
    psle_score,
    lrf4,
    lrf3,
    emb3,
    emb2,
    emb1,
    hnitec_course,
    hnitec_college,
    hnitec_gpa,
    diploma_course,
    polytechnic,
    diploma_gpa,
    bachelor_degree_name,
    university,
    gpa,
    master_degree_name,
    master_university,
    master_gpa,
    phd_degree_name,
    phd_university,
    phd_gpa,
    nitec_course,
    ite_college,
    nitec_gpa
  } = req.body;
  const qualification_image = req.file ? req.file.path : '';

  const sql = `
    INSERT INTO skills (
      profile_id,
      skill_level,
      psle_score,
      lrf4,
      lrf3,
      emb3,
      emb2,
      emb1,
      hnitec_course,
      hnitec_college,
      hnitec_gpa,
      diploma_course,
      polytechnic,
      diploma_gpa,
      bachelor_degree_name,
      university,
      gpa,
      master_degree_name,
      master_university,
      master_gpa,
      phd_degree_name,
      phd_university,
      phd_gpa,
      nitec_course,
      ite_college,
      nitec_gpa,
      qualification_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    profile_id,
    skill_level,
    psle_score,
    lrf4,
    lrf3,
    emb3,
    emb2,
    emb1,
    hnitec_course,
    hnitec_college,
    hnitec_gpa,
    diploma_course,
    polytechnic,
    diploma_gpa,
    bachelor_degree_name,
    university,
    gpa,
    master_degree_name,
    master_university,
    master_gpa,
    phd_degree_name,
    phd_university,
    phd_gpa,
    nitec_course,
    ite_college,
    nitec_gpa,
    qualification_image
  ];

  connection.query(sql, values, (error, results) => {
    if (error) {
      console.error('Error inserting skills into database:', error);
      return res.status(500).send('Error adding skills');
    }
    res.redirect(`/add_employment?profileId=${profile_id}`);
  });
});

// Route to show the employment addition form
app.get('/add_employment', (req, res) => {
  const profileId = req.query.profileId;
  res.render('add_employment', { profileId });
});

// Route to handle employment addition and redirect to add references
app.post('/submit-employment', (req, res) => {
  const profileId = req.body.profileId;
  const { employment_start, employment_end, company_name, position } = req.body;

  console.log('Received employment data:', req.body);

  const employmentEntries = employment_start.map((start, index) => [
    profileId,
    start,
    employment_end[index],
    company_name[index],
    position[index]
  ]);

  console.log('Prepared employment entries:', employmentEntries);

  const sql = 'INSERT INTO employment_history (profile_id, employment_start, employment_end, company_name, position) VALUES ?';

  connection.query(sql, [employmentEntries], (error, results) => {
    if (error) {
      console.error('Error inserting employment history into database:', error);
      return res.status(500).send('Error adding employment history');
    }
    res.redirect(`/add_ref?profileId=${profileId}`);
  });
});

// Route to show the references addition form
app.get('/add_ref', (req, res) => {
  const profileId = req.query.profileId;
  res.render('add_ref', { profileId });
});

// Route to handle reference addition
app.post('/add_ref', (req, res) => {
  console.log('Received POST request to /add_ref');
  console.log('Request body:', req.body);

  const { profileId, reference_name, reference_phone, reference_email, reference_relationship } = req.body;

  const referenceEntries = reference_name.map((name, index) => [
    profileId,
    name,
    reference_phone[index],
    reference_email[index],
    reference_relationship[index]
  ]);

  const sql = 'INSERT INTO reference_entries (profile_id, reference_name, reference_phone, reference_email, reference_relationship) VALUES ?';

  connection.query(sql, [referenceEntries], (error, results) => {
    if (error) {
      console.error('Error inserting references into database:', error);
      return res.status(500).send('Error adding references');
    }
    // Redirect to view_profile.ejs
    res.redirect('/view-profile');
  });
});

// Route to display all data in view_profile.ejs
app.get('/view-profile', (req, res) => {
  // Prepare SQL queries to fetch data from all relevant tables
  const queryProfiles = 'SELECT * FROM profiles';
  const queryEmploymentHistory = 'SELECT * FROM employment_history';
  const queryReferences = 'SELECT * FROM reference_entries';
  const querySkills = 'SELECT * FROM skills';

  // Execute query for profiles
  connection.query(queryProfiles, (err, profiles) => {
    if (err) {
      return res.status(500).send('Error retrieving profiles: ' + err.message);
    }

    // Execute query for employment history
    connection.query(queryEmploymentHistory, (err, employmentHistory) => {
      if (err) {
        return res.status(500).send('Error retrieving employment history: ' + err.message);
      }

      // Execute query for references
      connection.query(queryReferences, (err, references) => {
        if (err) {
          return res.status(500).send('Error retrieving references: ' + err.message);
        }

        // Execute query for skills
        connection.query(querySkills, (err, skills) => {
          if (err) {
            return res.status(500).send('Error retrieving skills: ' + err.message);
          }

          // Render the view_profile.ejs with the data
          res.render('view_profile', {
            profiles: profiles,
            employmentHistory: employmentHistory,
            references: references,
            skills: skills
          });
        });
      });
    });
  });
});

// Route to display all data
app.get('/all-data', (req, res) => {
  const queryProfiles = 'SELECT * FROM profiles';
  const queryEmploymentHistory = 'SELECT * FROM employment_history';
  const queryReferences = 'SELECT * FROM reference_entries';
  const querySkills = 'SELECT * FROM skills';

  connection.query(queryProfiles, (err, profiles) => {
    if (err) {
      return res.status(500).send('Error retrieving profiles');
    }
    connection.query(queryEmploymentHistory, (err, employmentHistory) => {
      if (err) {
        return res.status(500).send('Error retrieving employment history');
      }
      connection.query(queryReferences, (err, references) => {
        if (err) {
          return res.status(500).send('Error retrieving references');
        }
        connection.query(querySkills, (err, skills) => {
          if (err) {
            return res.status(500).send('Error retrieving skills');
          }
          // Ensure the render function points to 'view_profile.ejs'
          res.render('view_profile', {
            profiles: profiles,
            employmentHistory: employmentHistory,
            references: references,
            skills: skills
          });
        });
      });
    });
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route to show the profile edit form
app.get('/edit_profile/:id', (req, res) => {
  const profileId = req.params.id;
  const sql = 'SELECT * FROM profiles WHERE id = ?';
  connection.query(sql, [profileId], (error, results) => {
    if (error) {
      console.error('Error retrieving profile:', error.message);
      return res.status(500).send('Error retrieving profile');
    }
    res.render('edit_profile', { profile: results[0] });
  });
});

// Route to handle profile update
app.post('/edit_profile/:id', upload.single('picture_path'), (req, res) => {
  const profileId = req.params.id;
  const { name, phoneNumber, address, email } = req.body;
  const picturePath = req.file ? req.file.path : req.body.current_picture_path;

  const sql = 'UPDATE profiles SET name = ?, picture_path = ?, phone_number = ?, address = ?, email = ? WHERE id = ?';
  connection.query(sql, [name, picturePath, phoneNumber, address, email, profileId], (error, results) => {
    if (error) {
      console.error('Error updating profile:', error.message);
      return res.status(500).send('Error updating profile');
    }
    res.redirect('/view-profile');
  });
});

// Route to handle profile deletion
app.post('/delete_profile/:id', (req, res) => {
  const profileId = req.params.id;

  // Delete related data first due to foreign key constraints
  const deleteSkills = 'DELETE FROM skills WHERE profile_id = ?';
  const deleteEmployment = 'DELETE FROM employment_history WHERE profile_id = ?';
  const deleteReferences = 'DELETE FROM reference_entries WHERE profile_id = ?';

  connection.query(deleteSkills, [profileId], (error, results) => {
    if (error) {
      console.error('Error deleting skills:', error.message);
      return res.status(500).send('Error deleting skills');
    }

    connection.query(deleteEmployment, [profileId], (error, results) => {
      if (error) {
        console.error('Error deleting employment history:', error.message);
        return res.status(500).send('Error deleting employment history');
      }

      connection.query(deleteReferences, [profileId], (error, results) => {
        if (error) {
          console.error('Error deleting references:', error.message);
          return res.status(500).send('Error deleting references');
        }

        const deleteProfile = 'DELETE FROM profiles WHERE id = ?';
        connection.query(deleteProfile, [profileId], (error, results) => {
          if (error) {
            console.error('Error deleting profile:', error.message);
            return res.status(500).send('Error deleting profile');
          }
          res.redirect('/view-profile');
        });
      });
    });
  });
});

// Similarly, add routes for employment, reference, and skill edits and deletions

// Example for editing employment
app.get('/edit_employment/:id', (req, res) => {
  const employmentId = req.params.id;
  const sql = 'SELECT * FROM employment_history WHERE id = ?';
  connection.query(sql, [employmentId], (error, results) => {
    if (error) {
      console.error('Error retrieving employment:', error.message);
      return res.status(500).send('Error retrieving employment');
    }
    res.render('edit_employment', { employment: results[0] });
  });
});

app.post('/edit_employment/:id', (req, res) => {
  const employmentId = req.params.id;
  const { company_name, position, employment_start, employment_end } = req.body;

  const sql = 'UPDATE employment_history SET company_name = ?, position = ?, employment_start = ?, employment_end = ? WHERE id = ?';
  connection.query(sql, [company_name, position, employment_start, employment_end, employmentId], (error, results) => {
    if (error) {
      console.error('Error updating employment:', error.message);
      return res.status(500).send('Error updating employment');
    }
    res.redirect('/view-profile');
  });
});

app.post('/delete_employment/:id', (req, res) => {
  const employmentId = req.params.id;
  const sql = 'DELETE FROM employment_history WHERE id = ?';
  connection.query(sql, [employmentId], (error, results) => {
    if (error) {
      console.error('Error deleting employment:', error.message);
      return res.status(500).send('Error deleting employment');
    }
    res.redirect('/view-profile');
  });
});

// Route to handle profile deletion
app.post('/delete_profile/:id', (req, res) => {
  const profileId = req.params.id;

  // Delete related employment history
  const deleteEmploymentHistory = 'DELETE FROM employment_history WHERE profile_id = ?';
  connection.query(deleteEmploymentHistory, [profileId], (error, results) => {
    if (error) {
      console.error('Error deleting employment history:', error.message);
      return res.status(500).send('Error deleting employment history');
    }

    // Delete related references
    const deleteReferences = 'DELETE FROM reference_entries WHERE profile_id = ?';
    connection.query(deleteReferences, [profileId], (error, results) => {
      if (error) {
        console.error('Error deleting references:', error.message);
        return res.status(500).send('Error deleting references');
      }

      // Delete related skills
      const deleteSkills = 'DELETE FROM skills WHERE profile_id = ?';
      connection.query(deleteSkills, [profileId], (error, results) => {
        if (error) {
          console.error('Error deleting skills:', error.message);
          return res.status(500).send('Error deleting skills');
        }

        // Finally, delete the profile
        const deleteProfile = 'DELETE FROM profiles WHERE id = ?';
        connection.query(deleteProfile, [profileId], (error, results) => {
          if (error) {
            console.error('Error deleting profile:', error.message);
            return res.status(500).send('Error deleting profile');
          }
          res.redirect('/view-profile');
        });
      });
    });
  });
});

app.get('/edit_reference/:id', (req, res) => {
  const referenceId = req.params.id;
  const sql = 'SELECT * FROM reference_entries WHERE id = ?';
  connection.query(sql, [referenceId], (error, results) => {
    if (error) {
      console.error('Error retrieving reference record:', error.message);
      return res.status(500).send('Error retrieving reference record');
    }
    res.render('edit_ref', { reference: results[0] });
  });
});

app.post('/edit_reference/:id', (req, res) => {
  const referenceId = req.params.id;
  const { reference_name, reference_phone, reference_email, reference_relationship } = req.body;

  const sql = 'UPDATE reference_entries SET reference_name = ?, reference_phone = ?, reference_email = ?, reference_relationship = ? WHERE id = ?';
  connection.query(sql, [reference_name, reference_phone, reference_email, reference_relationship, referenceId], (error, results) => {
    if (error) {
      console.error('Error updating reference record:', error.message);
      return res.status(500).send('Error updating reference record');
    }
    res.redirect('/view-profile');
  });
});

app.get('/edit_skill/:id', (req, res) => {
  const skillId = req.params.id;
  const sql = 'SELECT * FROM skills WHERE id = ?';
  connection.query(sql, [skillId], (error, results) => {
    if (error) {
      console.error('Error retrieving skill record:', error.message);
      return res.status(500).send('Error retrieving skill record');
    }
    res.render('edit_skills', { skill: results[0] });
  });
});

app.post('/edit_skill/:id', upload.single('qualification_image'), (req, res) => {
  const skillId = req.params.id;
  const { skill_level } = req.body;
  let qualificationImage = req.file ? req.file.path : req.body.existing_image;

  const sql = 'UPDATE skills SET skill_level = ?, qualification_image = ? WHERE id = ?';
  connection.query(sql, [skill_level, qualificationImage, skillId], (error, results) => {
    if (error) {
      console.error('Error updating skill record:', error.message);
      return res.status(500).send('Error updating skill record');
    }
    res.redirect('/view-profile');
  });
});

app.post('/delete_reference/:id', (req, res) => {
  const referenceId = req.params.id;
  const sql = 'DELETE FROM reference_entries WHERE id = ?';
  connection.query(sql, [referenceId], (error, results) => {
      if (error) {
          console.error('Error deleting reference:', error.message);
          return res.status(500).send('Error deleting reference');
      }
      res.redirect('/view-profile');
  });
});

app.post('/delete_skill/:id', (req, res) => {
  const skillId = req.params.id;
  const sql = 'DELETE FROM skills WHERE id = ?';
  connection.query(sql, [skillId], (error, results) => {
      if (error) {
          console.error('Error deleting skill:', error.message);
          return res.status(500).send('Error deleting skill');
      }
      res.redirect('/view-profile');
  });
});

// Set the port and start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
 

