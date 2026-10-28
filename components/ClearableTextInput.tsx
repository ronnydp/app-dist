import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

type State = { isFocused: boolean };

const WRAPPER_KEYS = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'width', 'alignSelf',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical',
] as const;

export default class ClearableTextInput extends React.Component<TextInputProps, State> {
  state: State = { isFocused: false };
  private inputRef = React.createRef<TextInput>();

  focus() {
    this.inputRef.current?.focus();
  }

  blur() {
    this.inputRef.current?.blur();
  }

  clear() {
    this.inputRef.current?.clear();
  }

  private handleClear = () => {
    this.props.onChangeText?.('');
    this.inputRef.current?.focus();
  };

  render() {
    const { style, onFocus, onBlur, value, editable, multiline, ...rest } = this.props;
    const flat = (StyleSheet.flatten(style) || {}) as Record<string, any>;
    const wrapperStyle: Record<string, any> = {};
    const inputStyle: Record<string, any> = { ...flat };
    for (const key of WRAPPER_KEYS) {
      if (flat[key] !== undefined) {
        wrapperStyle[key] = flat[key];
        delete inputStyle[key];
      }
    }
    const isNumeric = ['numeric', 'number-pad', 'decimal-pad', 'phone-pad'].includes(rest.keyboardType ?? '');
    const showClear = !isNumeric && this.state.isFocused && !!value && editable !== false;

    return (
      <View style={wrapperStyle}>
        <TextInput
          {...rest}
          ref={this.inputRef}
          value={value}
          editable={editable}
          multiline={multiline}
          style={[inputStyle, showClear && styles.withClear]}
          onFocus={(e) => {
            this.setState({ isFocused: true });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            this.setState({ isFocused: false });
            onBlur?.(e);
          }}
        />
        {showClear && (
          <TouchableOpacity
            style={[styles.clearButton, multiline && styles.clearButtonTop]}
            onPress={this.handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  withClear: { paddingRight: 28 },
  clearButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  clearButtonTop: { bottom: undefined, top: 10 },
});
