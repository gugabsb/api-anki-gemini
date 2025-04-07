exports.handler = async (event, context) => {
    const user = context.clientContext.user;
    if (!user) return { statusCode: 401, body: 'Acesso não autorizado' };
  
    // Verifique no seu sistema se o usuário tem acesso pago
    const hasAccess = await checkUserAccess(user.email); // Implemente esta função
  
    if (!hasAccess) return { statusCode: 403, body: 'Faça upgrade para acessar' };
  
    return {
      statusCode: 200,
      body: JSON.stringify({ download_url: 'https://...' })
    };
  };