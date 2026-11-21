import {ImageResponse} from 'next/og';
export const size={width:512,height:512};
export const contentType='image/png';
export default function Icon(){
 return new ImageResponse(<div style={{
  background:'#d12d32',color:'#fff',width:'100%',height:'100%',display:'flex',
  alignItems:'center',justifyContent:'center',borderRadius:112,
  fontSize:118,fontWeight:900,fontFamily:'sans-serif',letterSpacing:-9
 }}>NEJ<span style={{color:'#fff'}}>LON</span></div>,size);
}
