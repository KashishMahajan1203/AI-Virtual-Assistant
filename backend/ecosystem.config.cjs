module.exports = {
    apps: [{
        name: "virtual-assistant-api",
        script: "index.js",
        cwd: __dirname,
        instances: 1,
        exec_mode: "fork",
        autorestart: true,
        watch: false,
        max_memory_restart: "300M",
        env: {
            NODE_ENV: "production",
        },
    }],
};