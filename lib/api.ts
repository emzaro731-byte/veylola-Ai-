const API_BASE_URL = process.env.EXPO_PUBLIC_DESTINY_API_URL ?? "https://YOUR_PROJECT_REF.supabase.co/functions/v1";

async function request(path:string, body:Record<string,unknown>){
  const res=await fetch(`${API_BASE_URL}${path}`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const data=await res.json();
  if(!res.ok) throw new Error(data?.error ?? "API request failed");
  return data;
}
export const askAI=(message:string,previous_response_id?:string)=>request("/destiny-ai",{message,...(previous_response_id?{previous_response_id}: {})});
export const generateImage=(prompt:string)=>request("/image-generate",{prompt,size:"1024x1024",quality:"high"});
export const generateVideo=(prompt:string)=>request("/video-generate",{prompt,seconds:8,size:"720x1280"});
export const generateMusic=(prompt:string)=>request("/music-generate",{prompt,duration:30});