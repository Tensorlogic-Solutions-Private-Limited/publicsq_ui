import { json as json$1 } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, request, cookies }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);

    let endpoint = PUBLIC_API_BASE_URL + "/v1/mediums";

    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    const options = {
      method: "GET",
      headers: { ...authHeader },
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      let mediums = await res.json();
      return json$1(mediums.data);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.error(err);
    return new Response(undefined, { status: 500 });
  }
}
