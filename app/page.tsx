'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/growth-feed-post';

const PROFILE_FOLDER = 'dummy-data-images';

type Composer = {
  text: string;
  profileImageUrl?: string;
};

type ParsedPost = {
  text: string;
  displayName: string;
  value: number;
  unit: string;
  reactions: number;
  streak: number;
  kudosCount: number;
  profilePhotoURI: string;
};

export default function HomePage() {
  const [composers, setComposers] = useState<Composer[]>([]);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const [modalSelectionByComposer, setModalSelectionByComposer] = useState<Record<number, string | null>>({});
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [parsedPosts, setParsedPosts] = useState<ParsedPost[]>([]);
  const [isSavingPosts, setIsSavingPosts] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const addComposer = () => {
    setComposers((current) => [...current, { text: '', profileImageUrl: DEFAULT_PROFILE_IMAGE }]);
  };

  const updateComposer = (index: number, value: string) => {
    setComposers((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, text: value } : item)));
  };

  const handleSelectProfileImage = (imageUrl: string) => {
    setSelectedProfileImage(imageUrl);
    if (activeModalIndex !== null) {
      setModalSelectionByComposer((current) => ({ ...current, [activeModalIndex]: imageUrl }));
    }
  };

  const saveSelectedProfileImage = () => {
    if (activeModalIndex === null || !selectedProfileImage) {
      setActiveModalIndex(null);
      return;
    }

    setComposers((current) =>
      current.map((item, itemIndex) => (itemIndex === activeModalIndex ? { ...item, profileImageUrl: selectedProfileImage } : item)),
    );
    setSelectedProfileImage(null);
    setActiveModalIndex(null);
  };

  const parsePostContent = (rawText: string, profilePhotoURI: string): ParsedPost => {
    const normalized = rawText.replace(/\r\n/g, '\n').trim();

    const extractLabelValue = (label: string) => {
      const match = normalized.match(new RegExp(`${label}:\\s*([^\\n]+)`, 'i'));
      return match ? match[1].trim() : '';
    };

    const extractPostText = () => {
      const match = normalized.match(/Post text:\s*([\s\S]*?)(?=\n\s*Post author:|\n\s*Posted:|\n\s*Reactions:|\n\s*Streak:|\n\s*Kudos received:|$)/i);
      return match ? match[1].trim() : '';
    };

    const author = extractLabelValue('Post author');
    const posted = extractLabelValue('Posted');
    const reactions = Number(extractLabelValue('Reactions')) || 0;
    const streak = Number(extractLabelValue('Streak').match(/\d+/)?.[0] || 0);
    const kudosCount = Number(extractLabelValue('Kudos received')) || 0;
    const postedMatch = posted.match(/(\d+)\s*(second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago/i);

    return {
      text: extractPostText().replace(/^Post text:\s*/i, '').trim(),
      displayName: author,
      value: postedMatch ? Number(postedMatch[1]) : 1,
      unit: postedMatch ? postedMatch[2].toLowerCase() : 'hour',
      reactions,
      streak,
      kudosCount,
      profilePhotoURI: profilePhotoURI || DEFAULT_PROFILE_IMAGE,
    };
  };

  const handleAddAllPosts = async () => {
    const parsed = composers
      .map((composer) => parsePostContent(composer.text, composer.profileImageUrl || DEFAULT_PROFILE_IMAGE))
      .filter((post) => post.text.trim().length > 0);

    if (parsed.length === 0) {
      return;
    }

    setIsSavingPosts(true);
    setSaveError(null);
    setSaveSuccess(null);

    const savedPosts: ParsedPost[] = [];

    for (const post of parsed) {
      try {
        const response = await fetch('/api/growth-feed-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: post.text,
            displayName: post.displayName,
            value: post.value,
            unit: post.unit,
            reactions: post.reactions,
            kudosCount: post.kudosCount,
            streak: post.streak,
            profilePhotoURI: post.profilePhotoURI,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Failed to save post');
        }

        savedPosts.push(post);
      } catch (error) {
        console.error('Failed to save post:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to save posts');
        break;
      }
    }

    if (savedPosts.length > 0) {
      setParsedPosts((current) => [...savedPosts, ...current]);
      setComposers((current) => current.filter((composer) => !composer.text.trim()));
      setSaveSuccess(
        savedPosts.length === 1 ? '1 post added successfully' : `${savedPosts.length} posts added successfully`,
      );
    }

    setIsSavingPosts(false);
  };

  useEffect(() => {
    if (!saveSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [saveSuccess]);

  useEffect(() => {
    const loadProfileImages = async () => {
      setIsLoadingImages(true);
      try {
        const response = await fetch(`/api/profile-images?folder=${encodeURIComponent(PROFILE_FOLDER)}`);
        if (!response.ok) {
          throw new Error('Unable to load images');
        }
        const data = await response.json();
        setProfileImages(Array.isArray(data.images) ? data.images : []);
      } catch (error) {
        console.error(error);
        setProfileImages([]);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadProfileImages();
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <div className="headerRow">
          <div>
            <p className="eyebrow">Growth Feed</p>
            <h1>Add Community Posts</h1>
          </div>
          <button className="actionButton" onClick={addComposer}>
            New Post
          </button>
        </div>

        <div className="composerGrid">
          {composers.map((composer, index) => (
            <div className="composer" key={index}>
              <div className="composerHeader">
                <div className="avatarCircle">
                  <img
                    src={composer.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                    alt="Profile avatar"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <textarea
                  className="postInput"
                  value={composer.text}
                  onChange={(event) => updateComposer(index, event.target.value)}
                  placeholder="Paste the post content here..."
                  rows={10}
                />
              </div>
              <div className="composerActions">
                <button
                  className="profileButton"
                  onClick={() => {
                    setSelectedProfileImage(modalSelectionByComposer[index] ?? null);
                    setActiveModalIndex(index);
                  }}
                >
                  Add Profile Pic
                </button>
              </div>
            </div>
          ))}
        </div>

        {(saveError || saveSuccess) && (
          <div className="saveFeedback">
            {saveError && <p className="saveError">{saveError}</p>}
            {saveSuccess && <p className="saveSuccess">{saveSuccess}</p>}
          </div>
        )}

        {composers.length > 0 && (
          <div className="bottomActions">
            <button className="actionButton" onClick={handleAddAllPosts} type="button" disabled={isSavingPosts}>
              {isSavingPosts ? 'Adding Posts…' : 'Add All Posts'}
            </button>
          </div>
        )}
      </section>

      {activeModalIndex !== null && (
        <div className="modalOverlay" onClick={() => setActiveModalIndex(null)}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <h2>Select a profile pic</h2>
              <button
                className="closeButton"
                onClick={() => setActiveModalIndex(null)}
                aria-label="Close modal"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="profileGrid">
              {isLoadingImages ? (
                <p className="modalEmptyState">Loading profile pictures…</p>
              ) : profileImages.length === 0 ? (
                <p className="modalEmptyState">No profile pictures found.</p>
              ) : (
                profileImages.map((imageUrl) => (
                  <button
                    key={imageUrl}
                    className={`profileOption ${selectedProfileImage === imageUrl ? 'selected' : ''}`}
                    onClick={() => handleSelectProfileImage(imageUrl)}
                    type="button"
                  >
                    <img src={imageUrl} alt="Profile option" loading="lazy" decoding="async" />
                  </button>
                ))
              )}
            </div>
            <div className="modalActions">
              <button className="actionButton" onClick={saveSelectedProfileImage} type="button">
                Select Image
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
