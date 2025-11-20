
import { getHeaders } from "$lib/utils/helper.js";
import { PUBLIC_API_BASE_URL } from "$env/static/public";

export async function GET({ params, request, cookies }) {
  let res;
  try {
    const authHeader = getHeaders(cookies);

    let endpoint = PUBLIC_API_BASE_URL + "/v1/excel-template";

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
      return new Response("Failed to fetch template", { status: res.status });
    }

    // Proxy the file as a download
    const contentType = res.headers.get("content-type") || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const contentDisposition = res.headers.get("content-disposition") || "attachment; filename=template.xlsx";
    const fileBuffer = await res.arrayBuffer();
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": contentDisposition,
      },
    });
  } catch (err) {
    console.log(err);
    return new Response(undefined, { status: 500 });
  }
}
