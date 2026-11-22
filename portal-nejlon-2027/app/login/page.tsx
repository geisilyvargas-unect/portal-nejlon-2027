import type {Metadata} from 'next';
import {DemoTour} from '@/components/demo-tour';

export const metadata:Metadata={
 title:'Portal NEJLON 2027 | Conheça as visões',
 description:'Explore a demonstração interativa do Portal de Governança NEJLON 2027 sem criar conta ou digitar senha.',
 robots:{index:false,follow:false}
};

export default function Login(){
 return <main className="landing"><DemoTour/></main>;
}
