exports.handler = async(event) => {
    return {
        statusCode: 302,
        headers: {
            Location: `https://plupzqjkynaprsluelwt.supabase.co/auth/v1/callback?${event.rawQuery}`,
        },
    };
};