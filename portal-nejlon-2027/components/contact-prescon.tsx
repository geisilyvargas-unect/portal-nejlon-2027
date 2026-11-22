import {MessageCircle} from 'lucide-react';

const whatsappUrl='https://wa.me/5547920011377?text=Ol%C3%A1%2C%20PRESCON%21%20Preciso%20de%20ajuda%20com%20o%20Portal%20NEJLON%202027.';
export function ContactPrescon(){
 return <a
   className="contact-prescon no-print"
   href={whatsappUrl}
   target="_blank"
   rel="noopener noreferrer"
   aria-label="Contato PRESCON pelo WhatsApp (abre uma nova aba)"
   title="Fale com a PRESCON pelo WhatsApp"
  >
   <MessageCircle size={22} aria-hidden strokeWidth={2.5}/>
   <span>Contato PRESCON</span>
  </a>;
}
