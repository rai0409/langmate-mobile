import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { serverTimestamp } from "firebase/firestore";
import { getConfiguredStorage } from "./firestoreHelpers";
import { upsertProfile } from "./profileRepository";

const PROFILE_PHOTO_CONTENT_TYPE = "image/jpeg";

export async function uploadProfilePhoto(
  uid: string,
  imageUri: string
): Promise<string> {
  const storage = getConfiguredStorage();
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const photoRef = ref(storage, `profilePhotos/${uid}/avatar.jpg`);

  await uploadBytes(photoRef, blob, {
    contentType: PROFILE_PHOTO_CONTENT_TYPE,
  });

  const photoURL = await getDownloadURL(photoRef);
  await upsertProfile(uid, {
    photoURL,
    photoUpdatedAt: serverTimestamp(),
  });
  return photoURL;
}
