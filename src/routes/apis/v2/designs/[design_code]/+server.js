import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function DELETE({ params, request, cookies, fetch }) {
  let res;
  try {
    const design_code = params.design_code;

    const authHeader = getHeaders(cookies);

    let endpoint = PUBLIC_API_BASE_URL + "/v2/designs/" + design_code;

    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    const options = {
      method: "DELETE",
      headers: { ...authHeader },
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 204 || res.status == 200) {
      // Return 204 No Content on success
      return new Response(null, { status: 204 });
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}
