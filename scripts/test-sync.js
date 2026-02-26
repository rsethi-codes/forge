
const { syncUserDailyLogin } = require('../src/lib/actions/login-sync');
const { format } = require('date-fns');

async function test() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    console.log('Testing sync for today:', todayStr);
    try {
        // This will likely fail due to lack of auth in a raw node script
        // but I can bypass auth for this test if I modify the action temporarily
    } catch (e) {
        console.error(e);
    }
}
test();
