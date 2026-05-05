import { useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { Learn } from './screens/Learn';
import { Shop } from './screens/Shop';
import { Wardrobe } from './screens/Wardrobe';
import { ParentGate } from './screens/ParentGate';

type Route = 'home' | 'learn' | 'shop' | 'wardrobe' | 'parent';

function parseHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (h === 'learn' || h === 'shop' || h === 'wardrobe' || h === 'parent') return h;
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
    default:
      return (
        <Home
          onLearn={() => go('learn')}
          onShop={() => go('shop')}
          onWardrobe={() => go('wardrobe')}
          onParent={() => go('parent')}
        />
      );
  }
}
