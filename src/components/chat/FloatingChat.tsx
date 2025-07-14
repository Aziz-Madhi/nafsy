import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Modal, Dimensions, Platform } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Send } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import * as Haptics from 'expo-haptics';

interface FloatingMessage {
  id: string;
  text: string;
  isUser: boolean;
}

interface FloatingChatProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FloatingChat({ visible, onClose }: FloatingChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      setMessages([]);
      setMessage('');
    }
  }, [visible]);

  const handleSend = () => {
    if (message.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newMessage: FloatingMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isUser: true,
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // Keep only last 3 messages
        return updated.slice(-3);
      });

      setMessage('');

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: FloatingMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'm listening. Tell me more.",
          isUser: false,
        };
        
        setMessages((prev) => {
          const updated = [...prev, aiResponse];
          return updated.slice(-3);
        });
      }, 1500);
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[{ flex: 1 }, backdropStyle]}>
        <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
          <Pressable onPress={onClose} style={{ flex: 1 }}>
            <View className="flex-1 justify-center items-center px-6">
              {/* Close button */}
              <Animated.View
                entering={FadeIn.delay(200)}
                className="absolute top-16 right-6 z-10"
              >
                <Pressable
                  onPress={onClose}
                  className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                >
                  <X size={24} className="text-white" />
                </Pressable>
              </Animated.View>

              {/* Messages */}
              <View className="absolute top-32 left-0 right-0 px-6">
                {messages.map((msg, index) => (
                  <Animated.View
                    key={msg.id}
                    entering={SlideInDown.springify()}
                    exiting={FadeOut.duration(500)}
                    style={{
                      opacity: 1 - (messages.length - index - 1) * 0.3,
                    }}
                    className={`mb-3 ${msg.isUser ? 'items-end' : 'items-start'}`}
                  >
                    <View
                      className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                        msg.isUser
                          ? 'bg-primary'
                          : 'bg-white/20 backdrop-blur-md'
                      }`}
                    >
                      <Text
                        variant="body"
                        className={msg.isUser ? 'text-primary-foreground' : 'text-white'}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>

              {/* Input */}
              <Animated.View
                entering={SlideInDown.delay(100).springify()}
                className="w-full"
              >
                <View className="flex-row items-center bg-white/20 backdrop-blur-md rounded-full px-5 py-3">
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="What's on your mind?"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    className="flex-1 text-white text-base mr-3"
                    style={{ fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}
                    autoFocus
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                  />
                  <Pressable
                    onPress={handleSend}
                    disabled={!message.trim()}
                    className="w-10 h-10 bg-primary rounded-full items-center justify-center"
                  >
                    <Send size={20} className="text-primary-foreground" />
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </Pressable>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}