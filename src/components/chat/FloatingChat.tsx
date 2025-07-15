import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Modal, Dimensions, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp, SlideInDown, SlideOutDown, withSpring, useAnimatedStyle, useSharedValue, withTiming, withDelay, interpolate, Easing, BounceIn, ZoomIn, withRepeat, LinearTransition, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Send, Clock, Check, CheckCheck } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import * as Haptics from 'expo-haptics';

type MessageStatus = 'sending' | 'sent' | 'delivered';

interface FloatingMessage {
  id: string;
  text: string;
  isUser: boolean;
  status: MessageStatus;
  timestamp: number;
}

interface FloatingChatProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FloatingChat({ visible, onClose }: FloatingChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const [messageId, setMessageId] = useState(0);
  
  // Shared values for animations
  const sendButtonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);
  
  // Shimmer/Glow effect for loading states
  const shimmerPosition = useSharedValue(-1);
  
  useEffect(() => {
    // Continuous shimmer animation using withRepeat
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1, // infinite repeats
      true // reverse animation
    );
  }, []);

  useEffect(() => {
    // Pulsing animation for system message indicator
    const pulse = () => {
      pulseScale.value = withSpring(1.2, { duration: 1000 }, () => {
        pulseScale.value = withSpring(1, { duration: 1000 });
      });
      pulseOpacity.value = withSpring(1, { duration: 1000 }, () => {
        pulseOpacity.value = withSpring(0.7, { duration: 1000 });
      });
    };
    
    const interval = setInterval(pulse, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animated style for pulsing dot
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Animated style for send button
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: message.trim() ? 1 : 0.5,
  }));

  // Shimmer/Glow effect style (fixed hook order)
  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-300, 300] // Fixed width to avoid dynamic hook calls
    );
    
    return {
      transform: [{ translateX }],
      opacity: 0.6,
    };
  });

  useEffect(() => {
    if (!visible) {
      setMessages([]);
      setMessage('');
    }
  }, [visible]);

  useEffect(() => {
    // Animate send button based on message input
    sendButtonScale.value = withSpring(message.trim() ? 1 : 0.8, {
      damping: 15,
      stiffness: 200,
    });
  }, [message]);

  const handleSend = () => {
    if (message.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Elastic Scale Effect on send - bounce animation
      sendButtonScale.value = withSpring(0.8, { 
        damping: 5, 
        stiffness: 300 
      }, () => {
        sendButtonScale.value = withSpring(1.1, { 
          damping: 8, 
          stiffness: 400 
        }, () => {
          sendButtonScale.value = withSpring(message.trim() ? 1 : 0.8, { 
            damping: 12, 
            stiffness: 300 
          });
        });
      });
      
      const newMessage: FloatingMessage = {
        id: messageId.toString(),
        text: message.trim(),
        isUser: true,
        status: 'sending',
        timestamp: Date.now(),
      };

      // Add to END of array (oldest-first approach for display)
      setMessages((prev) => {
        const updated = [...prev, newMessage];
        return updated.slice(-3); // Keep last 3 messages
      });

      setMessageId(prev => prev + 1);
      setMessage('');

      // Simulate message status updates
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'sent' as MessageStatus }
              : msg
          )
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 300);

      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'delivered' as MessageStatus }
              : msg
          )
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 600);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: FloatingMessage = {
          id: (messageId + 1).toString(),
          text: "I'm listening. Tell me more.",
          isUser: false,
          status: 'delivered',
          timestamp: Date.now(),
        };
        
        setMessages(prev => {
          const updated = [...prev, aiResponse];
          return updated.slice(-3);
        });
        
        setMessageId(prev => prev + 2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 1800);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(300)}
        style={{ flex: 1 }}
      >
        <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {/* Close button */}
            <Animated.View
              entering={FadeIn.springify().damping(20).stiffness(300).delay(200)}
              exiting={FadeOut.springify().damping(20)}
              className="absolute top-16 right-6 z-20"
            >
              <Pressable
                onPress={onClose}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
              >
                <X size={24} className="text-white" />
              </Pressable>
            </Animated.View>

            {/* Message Area - Center Section */}
            <View 
              className="absolute top-28 left-0 right-0 items-center justify-center px-6"
              style={{ 
                height: SCREEN_HEIGHT * 0.6,
                bottom: 120,
              }}
            >
              <View 
                className="items-center justify-end w-full"
                style={{ 
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {messages.map((msg, index, array) => {
                  const isNewest = index === array.length - 1;
                  const messageAge = array.length - 1 - index; // 0 = newest, 1 = second newest, etc.
                  const isOld = messageAge >= 2; // 3rd message and older
                  
                  // Message Appearance Cascade - each message enters with increasing delay
                  const cascadeDelay = index * 150; // 150ms between each message
                  
                  return (
                    <Animated.View
                      key={msg.id}
                      entering={
                        // Just appear in place with fade and slight scale
                        FadeIn
                          .springify()
                          .damping(25)
                          .stiffness(400)
                          .delay(cascadeDelay)
                      }
                      exiting={
                        // Enhanced Fade Transition with slight scale
                        FadeOut
                          .springify()
                          .damping(20)
                          .stiffness(300)
                          .duration(800)
                      }
                      layout={
                        // Sub-animation for repositioning when new messages appear
                        LinearTransition
                          .springify()
                          .damping(20)
                          .stiffness(300)
                          .duration(600)
                      }
                    >
                      <Animated.View
                        layout={
                          // Additional sub-animation for smooth repositioning
                          LinearTransition
                            .springify()
                            .damping(25)
                            .stiffness(350)
                            .duration(500)
                        }
                        style={{
                          opacity: messageAge === 0 ? 1 : messageAge === 1 ? 0.8 : Math.max(0.3, 0.6 - (messageAge - 2) * 0.15), // Progressive fade
                          transform: [
                            { scale: messageAge === 0 ? 1 : messageAge === 1 ? 0.98 : Math.max(0.85, 0.95 - (messageAge - 2) * 0.03) } // Progressive shrink
                          ]
                        }}
                      >
                        <View
                          className="backdrop-blur-md border border-opacity-30 rounded-2xl px-8 py-6 overflow-hidden"
                          style={{
                            maxWidth: 300,
                            minWidth: 120,
                            alignSelf: 'center',
                            
                            // Color based on message type
                            backgroundColor: msg.isUser ? '#9CC99A' : '#7BA7D9',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            
                            // Shadow for depth
                            shadowColor: msg.isUser ? '#9CC99A' : '#7BA7D9',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 8,
                          }}
                        >
                          {/* Shimmer/Glow effect for sending messages */}
                          {msg.status === 'sending' && (
                            <Animated.View
                              style={[
                                shimmerStyle,
                                {
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                  borderRadius: 16,
                                }
                              ]}
                            />
                          )}
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '500',
                              color: 'white',
                              textAlign: 'left',
                              lineHeight: 22,
                            }}
                          >
                            {msg.text}
                          </Text>

                          {/* Status indicator for user messages - only newest */}
                          {msg.isUser && isNewest && messageAge === 0 && (
                            <Animated.View
                              entering={
                                // Elastic Scale Effect for status changes
                                BounceIn.springify()
                                  .damping(8)
                                  .stiffness(200)
                                  .delay(300)
                              }
                              className="absolute -bottom-1 -right-1 bg-white/90 backdrop-blur-sm rounded-full p-1.5 border border-white/30"
                            >
                              {msg.status === 'sending' && (
                                <Clock size={12} color="#6B7280" />
                              )}
                              {msg.status === 'sent' && (
                                <Check size={12} color="#6B7280" />
                              )}
                              {msg.status === 'delivered' && (
                                <CheckCheck size={12} color="#9CC99A" />
                              )}
                            </Animated.View>
                          )}

                          {/* System message indicator - only newest */}
                          {!msg.isUser && isNewest && messageAge === 0 && (
                            <Animated.View
                              entering={
                                // Elastic Scale Effect for AI indicator
                                BounceIn.springify()
                                  .damping(10)
                                  .stiffness(300)
                                  .delay(200)
                              }
                              className="absolute -top-2 -left-2 backdrop-blur-sm rounded-full w-4 h-4 border border-white/30"
                              style={{ backgroundColor: '#7BA7D9' }}
                            >
                              <Animated.View
                                style={[pulseStyle]}
                                className="w-2 h-2 bg-white rounded-full m-1"
                              />
                            </Animated.View>
                          )}

                          {/* Enhanced glow effect for newest message only */}
                          {isNewest && messageAge === 0 && (
                            <Animated.View
                              entering={FadeIn.duration(100)}
                              exiting={FadeOut.duration(1500)}
                              className="absolute inset-0 rounded-2xl"
                              style={{
                                backgroundColor: msg.isUser ? 'rgba(156, 201, 154, 0.2)' : 'rgba(123, 167, 217, 0.2)',
                              }}
                            />
                          )}
                        </View>
                      </Animated.View>
                    </Animated.View>
                  );
                  })}
              </View>
            </View>

            {/* Input Area - Bottom Section */}
            <Animated.View
              entering={SlideInUp.springify().damping(30).stiffness(400).delay(300)}
              exiting={SlideOutUp.springify().damping(30)}
              className="absolute bottom-8 left-6 right-6"
            >
              <Animated.View
                entering={FadeIn.springify().damping(20)}
                className="flex-row items-center bg-white/20 backdrop-blur-md rounded-full px-5 py-3"
              >
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
                <Animated.View
                  style={[sendButtonStyle]}
                >
                  <Pressable
                    onPress={handleSend}
                    disabled={!message.trim()}
                    className="w-10 h-10 bg-primary rounded-full items-center justify-center"
                  >
                    <Send size={20} className="text-primary-foreground" />
                  </Pressable>
                </Animated.View>
              </Animated.View>
            </Animated.View>

            {/* Tap to close area */}
            <Pressable
              onPress={onClose}
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
              }}
            />
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}