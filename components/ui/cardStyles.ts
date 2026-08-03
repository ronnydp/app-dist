import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 0.7,
    borderColor: '#d8d9db'
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
    marginRight: 6,
  },
  orderTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  codigo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 12,
  },
  info: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  productsSection: {
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  productQty: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    minWidth: 25,
  },
  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  presentationName: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    minWidth: 70,
    textAlign: 'right',
  },
  noteSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  noteSnippetText: {
    fontSize: 13,
    color: '#92400e',
    marginLeft: 4,
    flex: 1,
  },
  actionsRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  actionButton: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
  },
});
