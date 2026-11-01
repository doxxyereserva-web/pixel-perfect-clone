import mascot from '@/assets/agata-original-mascot.png.asset.json';
import love from '@/assets/mascot-love.png.asset.json';
import excited from '@/assets/mascot-excited.png.asset.json';
import curious from '@/assets/mascot-curious.png.asset.json';
import sleepy from '@/assets/mascot-sleepy.png.asset.json';
import reading from '@/assets/mascot-reading.png.asset.json';
import peek from '@/assets/mascot-peek.png.asset.json';
import success from '@/assets/mascot-success.png.asset.json';
import alert from '@/assets/mascot-alert.png.asset.json';
import greet from '@/assets/mascot-headphones-happy.png.asset.json';
import wonder from '@/assets/mascot-headphones-thinking.png.asset.json';
import annoyed from '@/assets/mascot-headphones-grumpy.png.asset.json';

export const mascotImage = mascot.url;
export const expressions = {
  happy: { src: mascot.url, label: 'Happy' },
  love: { src: love.url, label: 'Friendly' },
  excited: { src: excited.url, label: 'Excited' },
  curious: { src: curious.url, label: 'Curious' },
  reading: { src: reading.url, label: 'Helpful' },
  sleepy: { src: sleepy.url, label: 'Resting' },
  peek: { src: peek.url, label: 'Always here' },
  success: { src: success.url, label: 'All set' },
  alert: { src: alert.url, label: 'Heads up' },
  greet: { src: greet.url, label: 'Hello' },
  wonder: { src: wonder.url, label: 'Wondering' },
  annoyed: { src: annoyed.url, label: 'Annoyed' },
} as const;
export type Expression = keyof typeof expressions;

export function Mascot({ mood = 'happy', className = 'size-9' }: { mood?: Expression; className?: string }) {
  return <img src={expressions[mood].src} alt={`Ágata — ${expressions[mood].label.toLowerCase()}`} className={`mascot-mark ${className}`} />;
}
export const AgataMark = Mascot;
export function Wordmark() {
  return <span className="flex items-center gap-2"><Mascot /><span translate="no" className="text-xl font-medium">Ágata</span></span>;
}
