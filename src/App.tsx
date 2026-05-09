import { useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { Learn } from './screens/Learn';
import { Shop } from './screens/Shop';
import { Wardrobe } from './screens/Wardrobe';
import { ParentGate } from './screens/ParentGate';
import { ListPicker } from './screens/ListPicker';
import { unlockTts } from './lib/tts';

type Route = 'home' | 'learn' | 'shop' | 'wardrobe' | 'parent' | 'list';

function parseHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (
    h === 'learn' ||
    h === 'shop' ||
    h === 'wardrobe' ||
    h === 'parent' ||
    h === 'list'
  ) {
    return h;
  }
  return 'home';
}

function setHash(r: Route) {
  if (r === 'home') location.hash = '#/';
  else location.hash = `#/${r}`;
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // iOS Safari requires a user gesture before speechSynthesis works.
  // Prime the synth on the first interaction anywhere in the app.
  useEffect(() => {
    const onFirstGesture = () => {
      unlockTts();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('touchstart', onFirstGesture, { once: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  const go = (r: Route) => setHash(r);

  switch (route) {
    case 'learn':
      return <Learn onBack={() => go('home')} />;
    case 'shop':
      return <Shop onBack={() => go('home')} />;
    case 'wardrobe':
      return <Wardrobe onBack={() => go('home')} />;
    case 'parent':
      return <ParentGate onBack={() => go('home')} />;
    case 'list':
      return <ListPicker onBack={() => go('home')} />;
    default:
      return (
        <Home
          onLearn={() => go('learn')}
          onShop={() => go('shop')}
          onWardrobe={() => go('wardrobe')}
          onParent={() => go('parent')}
          onList={() => go('list')}
        />
      );
  }
}
