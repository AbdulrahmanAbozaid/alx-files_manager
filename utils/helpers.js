export async function isOwner(req, ownerId) {
  //   const user = await getUserFromToken(req.headers['x-token']);
  //   return user && user._id.toString() === ownerId;
  return req && ownerId;
}
