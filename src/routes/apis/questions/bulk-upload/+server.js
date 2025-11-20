import { json as json$1 } from "@sveltejs/kit";
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function POST({ params, request, cookies }) {
  let res;
  try {
    const authToken = cookies.get("access_token");
    const formData = await request.formData();
    let endpoint = PUBLIC_API_BASE_URL + "/v1/upload-excel";

    let queryparams = request.url.split("?");

    if (queryparams?.length > 1) {
      endpoint += "?" + queryparams[1];
    }
    
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    };

    res = await fetch(endpoint, options);

    if (!res.ok) {
      return res;
    }

    if (res.status == 200) {
      let result = await res.json();
      return json$1(result);
    }

    return new Response("", { status: res.status });
  } catch (err) {
    console.log("error in bulk", err);
    return new Response(undefined, { status: 500 });
  }
}
