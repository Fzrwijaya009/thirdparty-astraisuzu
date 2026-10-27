/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import logoAsset from '../assets/logo.png';
import { ASTRA_ISUZU_LOGO_DATA_URI } from '../assets/logoDataUri';

interface AstraIsuzuLogoProps {
  className?: string;
  alt?: string;
  onClick?: () => void;
}

/**
 * AstraIsuzuLogo component that is guaranteed to load across all environments:
 * Local development, Production builds, GitHub Pages with repo subpath prefixes,
 * and downloaded/cloned repositories. It bundles the asset through Vite and provides
 * an embedded high-resolution Data URI fallback so it never shows a broken image icon.
 */
export const AstraIsuzuLogo: React.FC<AstraIsuzuLogoProps> = ({
  className = 'h-10 w-auto object-contain',
  alt = 'PT Astra International Tbk - Isuzu',
  onClick
}) => {
  const [hasError, setHasError] = useState(false);

  // If bundled asset fails to load, gracefully fall back to base64 Data URI
  const logoSrc = hasError ? ASTRA_ISUZU_LOGO_DATA_URI : (logoAsset || ASTRA_ISUZU_LOGO_DATA_URI);

  return (
    <img
      src={logoSrc}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      onClick={onClick}
      loading="eager"
      decoding="async"
    />
  );
};
