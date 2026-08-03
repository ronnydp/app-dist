import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  const {session, isLoading} = useAuth()

  if(isLoading){
    return null;
  }

  if(!session){
    return <Redirect href='/login' />;
  }

  return <Redirect href='/(tabs)/order' />;
}