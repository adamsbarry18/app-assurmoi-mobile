import { List } from 'react-native-paper'

export type LinkRowProps = { label: string; path: string }

export function LinkRow ({ label, path }: LinkRowProps) {
  return (
    <List.Item
      title={label}
      description={path}
      titleNumberOfLines={1}
      descriptionNumberOfLines={1}
    />
  )
}
