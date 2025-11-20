import { json } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";



export async function GET({ params, request, cookies }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);

    let endpoint = PUBLIC_API_BASE_URL + "/v1/questions";

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
      // let questions = await res.json();
      return json(dummyQuestions);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}

