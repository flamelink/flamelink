import * as firebase from 'firebase';

export default function(config = {}) {
  return firebase.initializeApp(config);
}
