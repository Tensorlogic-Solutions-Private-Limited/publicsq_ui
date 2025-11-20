import { json } from "@sveltejs/kit";
import { PUBLIC_API_BASE_URL } from "$env/static/public";
import { getHeaders } from "$lib/utils/helper.js";

export async function GET({ params, request, cookies }) {
  let res;
  try {
    const paper_code = params.id;
    const authHeader = getHeaders(cookies);

    let endpoint = PUBLIC_API_BASE_URL + "/v1/qn_papers/" + paper_code;
 
    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
       console.log("endpoint", endpoint);
    const options = {
      method: "GET",
      headers: { ...authHeader },
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      let qpaper = await res.json();
      return json(qpaper);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}
