import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const PREFIX = 'noor_guide_v3_';

interface Ctx {
  showTutorial: (key: string, message: string) => void;
  hide: () => void;
  visible: boolean;
  message: string;
}

const TutorialContext = createContext<Ctx>({
  showTutorial: () => {},
  hide: () => {},
  visible: false,
  message: '',
});

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const showTutorial = useCallback((key: string, msg: string) => {
    if (localStorage.getItem(PREFIX + key)) return;
    localStorage.setItem(PREFIX + key, '1');
    setMessage(msg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <TutorialContext.Provider value={{ showTutorial, hide, visible, message }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
