const mammoth = require('mammoth');
const fs = require('fs');

async function extractText() {
    try {
        const result = await mammoth.extractRawText({ path: 'Raghav_60Day_Senior_React_Roadmap.docx' });
        console.log(result.value);
    } catch (error) {
        console.error(error);
    }
}

extractText();
