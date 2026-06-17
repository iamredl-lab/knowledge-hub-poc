export class DocRoom implements DurableObject {
  fetch(): Response | Promise<Response> {
    return new Response("Not implemented", { status: 501 });
  }
}

export default {
  fetch(): Response | Promise<Response> {
    return new Response("Not implemented", { status: 501 });
  },
};
