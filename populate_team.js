require('dotenv').config(); // Load .env file variables
const { createClient } = require('@supabase/supabase-js'); // Use require

// WARNING: Only run this script once to avoid duplicate entries!

// Load environment variables from .env file
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the .env file.');
    process.exit(1); 
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const teamMembers = [
  { name: "Soha", description: "Founder & President. Hi there! I'm Soha, the founder and president of Pixel Pulse. I'm currently pursuing STEM and planning to major in either computer science or data science (still deciding!) at university. I truly hope Pixel Pulse grows into a valuable platform for both STEM students and beyond! I love reading and writing. :)", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/soha.jpg?v=1739739309844" },
  { name: "Shambhavee", description: "Secretary. I'm Shambhavee, a high school student studying Humanities, and I plan on pursuing Business Administration after school. Apart from Pixel Pulse, I've participated in a COP29 project and completed a journalism course. I love reading books, writing, and video editing.", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/shambhavee.jpg?v=1739816711854" },
  { name: "Harsith", description: "Newsletter Director. Hey there! I'm Harsith, a high school student super passionate about space, coffee, and badminton. I'm a STEM student and I love tinkering with projects and solving problems, and I'm excited about exploring aerospace engineering in the future. Really excited to be a part of this team!", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/harsith.jpg?v=1739739350036" },
  { name: "Breana", description: "Content Director. Hiii, I'm Breana!!! I'm a sophomore in high school and the Head of Content Writing at Pixel Pulse. I want to pursue a career in the medical field one day, especially working in Cardiology. I love to read and write, whether it's just a simple essay or a story!", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/breana2.jpg?v=1740245037363" },
  { name: "Lynn", description: "Media & Design Director. Hello! I'm Lynn, a high school junior. I want to pursue industrial design and/or digital media design in college. I'm an artist and I love food, penguins, and funny memes. I'm excited to work with Pixel Pulse as head of design!", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/lynn.png?v=1739739345758" },
  { name: "Nikit", description: "Website Lead. Hi, I'm Nikit, a high school freshman passionate about computer science, entrepreneurship, and SaaS development. I enjoy building web applications and exploring new technologies. My goal is to create innovative software solutions that solve real-world problems. When I'm not coding, I'm learning about startups and business strategy to help bring my ideas to life.", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/breana2.jpg?v=1740245037363" }, 
  { name: "Rolleen", description: "Physics & Chemistry Research Lead. I'm Rolleen (pronounced row-lean)! I'm a high school student with a passion for chemistry, looking to pursue Chemical Engineering. I'm a big music nerd but I'm also a debater outside of Pixel Pulse! Glad to be part of this team as the research lead for Chemistry and Physics. ^_^", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/rolleen.jpg?v=1739816415849" },
  { name: "Kate", description: "Psychology Research Lead. Hi! I'm Kate, the Psychology Research Lead. I have a strong passion for psychology and love exploring how the human mind works. I'm thrilled to be part of this team!", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/kate.jpg?v=1739739345781" },
  { name: "Ana", description: "Website Developer. Hi! I'm Ana, a high school junior planning to study Computer Science and Math at a four-year university. I love food and reading mystery books. I'm excited to be part of Pixel Pulse as a Web Developer!", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/pic.jpg?v=1739739385415" },
  { name: "Enaya", description: "Researcher (Physics & Chemistry). Hi, my name is Enaya. I'm pursuing STEM in high school, studying Physics, ICT, and Chemistry. Since my interest in arts aligns with it, I'm keen on majoring in architecture in the future!", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/enaya.jpg?v=1739816514144" },
  { name: "Darren", description: "Graphic Designer. Hi, I'm Darren, a high school student with experience in coding, web design, and graphic design. I'm passionate about technology and plan to pursue a computer science or software engineering career. Outside of tech, I enjoy both playing and watching sports, especially soccer and tennis.", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/darren.png?v=1739814810086" },
  { name: "Dara", description: "Graphic Designer. Hi, I'm Dara, a recent high school graduate with a passion for design and technology. I enjoy creating visually appealing designs as a hobby and have some experience in web development. I plan to pursue a career in computer science and will be starting college soon. Outside of tech, I love anime and animals.", image_url: "https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/dara.jpg?v=1739814808819" }
];

async function populateTeam() {
    console.log('Attempting to insert team members...');
    
    // Optional: Check if data already exists to prevent duplicates
    const { data: existingData, error: checkError } = await supabase
        .from('team_members')
        .select('name') // Select a small column just to check count
        .limit(1); 

    if (checkError) {
        console.error('Error checking existing data:', checkError);
        return;
    }

    if (existingData && existingData.length > 0) {
        console.log('Team members table already seems to contain data. Skipping insertion.');
        return;
    }

    const { data, error } = await supabase
        .from('team_members')
        .insert(teamMembers)
        .select(); // Select the inserted data to confirm

    if (error) {
        console.error('Error inserting team members:', error);
    } else {
        console.log('Successfully inserted team members:');
        console.log(data);
    }
}

populateTeam(); 