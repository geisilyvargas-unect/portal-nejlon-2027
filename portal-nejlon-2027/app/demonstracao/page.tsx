import type {Metadata} from 'next';
import {DemoTour} from '@/components/demo-tour';

export const metadata:Metadata={
 title:'Conheça o Portal NEJLON 2027 | Demonstração',
 description:'Conheça as visões de PRESCON, Conselho e DIREX do Portal de Governança NEJLON 2027 sem precisar de login.',
 robots:{index:false,follow:false}
};

export default function DemonstracaoPage(){
 return <DemoTour/>;
}
