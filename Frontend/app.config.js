import 'dotenv/config';

export default ({ config }) => ({
    ...config,
    extra: {
        ...config.extra,
        geminiApiKey: process.env.GEMINI_API_KEY,
    },
});
