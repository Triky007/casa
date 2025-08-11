export { default as colors } from './colors';
export { default as typography } from './typography';
export { default as spacing, borderRadius, shadows } from './spacing';

// Common style utilities
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },

  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },

  buttonTextPrimary: {
    color: '#FFFFFF',
  },

  buttonTextSecondary: {
    color: '#1F2937',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },

  inputFocused: {
    borderColor: '#3B82F6',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  spaceBetween: {
    justifyContent: 'space-between' as const,
  },

  textCenter: {
    textAlign: 'center' as const,
  },

  textBold: {
    fontWeight: 'bold' as const,
  },

  textSemiBold: {
    fontWeight: '600' as const,
  },

  textMuted: {
    color: '#6B7280',
  },

  textError: {
    color: '#EF4444',
  },

  textSuccess: {
    color: '#10B981',
  },

  textWarning: {
    color: '#F59E0B',
  },
};
