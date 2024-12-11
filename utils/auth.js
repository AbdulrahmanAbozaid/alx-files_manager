export const verifyBasicAuth = (authHeader) => {
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString(
    'ascii'
  );
  const [email, password] = credentials.split(':');
  return { email, password };
};
