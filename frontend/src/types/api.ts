import axios from "axios";

import { RequestMessage } from "@/types/common";


export const base_url = "http://localhost:8000";


// 向后端发送信息 
export async function SendDataToBackend(
    data: Record<string, string | number | boolean | null> | FormData, 
    url: string, 
    time_out: number | null
): Promise<RequestMessage> {
    let request = null;
    if (time_out) {
        request = axios.create({
            baseURL: base_url,
            timeout: time_out
        });
    }
    else request = axios.create({ baseURL: base_url });

    let response = null;

    try {
        response = await request.post(url, data);
        console.log("frontend/types/api SendDataToBackend: ", response);
        response = response.data;
    }
    catch (e) {
        console.log("/frontend/types/api SendDataToBackend: catch error: ", e);
        response = { source: "", state: false, message: "请求失败！", addition_args: { "error": e } };
    }

    return response;
}
