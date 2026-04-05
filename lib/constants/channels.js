/**
 * Channel configurations for Shorewatch
 * Defines channel types, templates, and voice guidelines
 */

export const CHANNELS = {
  PARENT: 'parent',
  PROVIDER: 'provider',
};

/**
 * Channel configuration by type
 * @type {Object<string, Object>}
 */
export const channelConfigs = {
  parent: {
    id: 'joincoralcare',
    name: 'Parent Community',
    displayName: 'Join Coral Care',
    description: 'Community for parents navigating pediatric therapy',
    voiceTemplate: 'parent_voice',
    icon: 'users',
    color: '#6366f1',
  },
  provider: {
    id: 'growwithcoral',
    name: 'Provider Network',
    displayName: 'Grow with Coral',
    description: 'Network for pediatric therapists and practitioners',
    voiceTemplate: 'provider_voice',
    icon: 'briefcase',
    color: '#8b5cf6',
  },
};

/**
 * Get channel config by type
 * @param {string} channelType - Channel type (parent|provider)
 * @returns {Object|null} Channel configuration or null if not found
 */
export function getChannelConfig(channelType) {
  return channelConfigs[channelType] || null;
}

/**
 * Get all channel types
 * @returns {string[]} Array of channel types
 */
export function getChannelTypes() {
  return Object.keys(channelConfigs);
}
