import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { requestAssistant } from '../lib/assistantApi';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'สวัสดีครับ ผมคือผู้ช่วยเกษตรอัจฉริยะ ต.ผักไหม มีข้อสงสัยเรื่องการปลูกข้าวหอมมะลิ 105 การใส่ปุ๋ย การจัดการน้ำ หรือมาตรฐาน GAP พิมพ์ถามได้เลยครับ',
};

export default function AssistantScreen(props) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollViewRef = useRef(null);
  const assistantRequestRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const nativeVoiceRef = useRef(null);
  const voiceBasePromptRef = useRef('');

  const setVoiceTranscript = (transcript) => {
    const text = transcript.trim();
    if (!text) return;
    const basePrompt = voiceBasePromptRef.current;
    setPrompt(basePrompt ? `${basePrompt} ${text}` : text);
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      assistantRequestRef.current?.abort();
      assistantRequestRef.current = null;

      if (speechRecognitionRef.current) {
        const recognition = speechRecognitionRef.current;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch (error) {
          console.warn('Stop browser speech recognition failed:', error);
        }
        speechRecognitionRef.current = null;
      }

      if (nativeVoiceRef.current) {
        nativeVoiceRef.current
          .destroy()
          .catch((error) => console.warn('Stop native speech recognition failed:', error));
        nativeVoiceRef.current = null;
      }
    };
  }, []);

  const handleBack = () => {
    if (typeof props.onBack === 'function') return props.onBack();
    if (typeof props.onClose === 'function') return props.onClose();
    if (typeof props.goBack === 'function') return props.goBack();
    if (props.navigation && typeof props.navigation.goBack === 'function') {
      return props.navigation.goBack();
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  const handleClearChat = () => {
    if (loading) return;
    setMessages([WELCOME_MESSAGE]);
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      try {
        if (Platform.OS === 'web' && speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        } else if (nativeVoiceRef.current) {
          await nativeVoiceRef.current.stop();
        }
      } catch (error) {
        setIsListening(false);
        Alert.alert('หยุดฟังเสียงไม่ได้', error.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    voiceBasePromptRef.current = prompt.trimEnd();
    setIsListening(true);

    if (Platform.OS === 'web') {
      const SpeechRecognition =
        typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

      if (!SpeechRecognition) {
        setIsListening(false);
        Alert.alert('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการรู้จำเสียง แนะนำให้ใช้ Google Chrome');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i += 1) {
          transcript += `${event.results[i][0].transcript} `;
        }
        setVoiceTranscript(transcript);
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'aborted') {
          const message =
            event.error === 'not-allowed' || event.error === 'service-not-allowed'
              ? 'กรุณาอนุญาตให้เบราว์เซอร์ใช้ไมโครโฟน แล้วลองอีกครั้ง'
              : event.error === 'no-speech'
                ? 'ไม่ได้ยินเสียงพูด กรุณาลองพูดอีกครั้ง'
                : `กรุณาลองอีกครั้ง (${event.error})`;
          Alert.alert('จับเสียงไม่สำเร็จ', message);
        }
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
        setIsListening(false);
      };
      speechRecognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (error) {
        speechRecognitionRef.current = null;
        setIsListening(false);
        Alert.alert('เริ่มใช้ไมโครโฟนไม่ได้', error.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;
      nativeVoiceRef.current = Voice;
      Voice.onSpeechResults = (event) => setVoiceTranscript(event.value?.[0] || '');
      Voice.onSpeechPartialResults = (event) => setVoiceTranscript(event.value?.[0] || '');
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechError = (event) => {
        setIsListening(false);
        Alert.alert(
          'จับเสียงไม่สำเร็จ',
          event.error || 'กรุณาตรวจสอบสิทธิ์ไมโครโฟนและลองพูดอีกครั้ง'
        );
      };

      const available = await Voice.isAvailable();
      if (!available) {
        setIsListening(false);
        Alert.alert('ไม่พบระบบรู้จำเสียง', 'กรุณาตรวจสอบว่ามีบริการรู้จำเสียงในอุปกรณ์');
        return;
      }

      await Voice.start('th-TH');
    } catch (error) {
      setIsListening(false);
      Alert.alert(
        'เริ่มใช้ไมโครโฟนไม่ได้',
        error.message || 'กรุณาเปิดแอปด้วย Development Build และอนุญาตใช้ไมโครโฟน'
      );
    }
  };

  const askAI = async () => {
    const textToSend = prompt.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setPrompt('');
    setLoading(true);
    const controller = new AbortController();
    assistantRequestRef.current = controller;

    try {
      // ส่งประวัติการคุย (ตัดข้อความต้อนรับเริ่มต้นออก) เพื่อให้ AI จำบริบทต่อเนื่องได้
      const historyForApi = updatedMessages
        .filter((m) => m.id !== 'welcome')
        .map(({ role, content }) => ({ role, content }));

      const text = await requestAssistant(historyForApi, props.context || '', controller.signal);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      if (controller.signal.aborted) return;
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'เกิดข้อผิดพลาด: ' + err.message,
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      if (assistantRequestRef.current === controller) {
        assistantRequestRef.current = null;
        setLoading(false);
      }
    }
  };

  const stopAI = () => {
    const controller = assistantRequestRef.current;
    if (!controller) return;
    assistantRequestRef.current = null;
    controller.abort();
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      askAI();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* แถบด้านบน */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← ย้อนกลับ</Text>
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            ผู้ช่วยเกษตรอัจฉริยะ (ต.ผักไหม)
          </Text>

          <TouchableOpacity style={styles.clearButton} onPress={handleClearChat} activeOpacity={0.7}>
            <Text style={styles.clearButtonText}>ล้างแชต</Text>
          </TouchableOpacity>
        </View>

        {/* พื้นที่แสดงข้อความแชตโต้ตอบ */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userRow : styles.aiRow,
                ]}
              >
                {!isUser && (
                  <Text style={styles.senderLabel}>ผู้ช่วยเกษตรอัจฉริยะ</Text>
                )}
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.aiBubble,
                    msg.isError && styles.errorBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userText : styles.aiText,
                      msg.isError && styles.errorText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, styles.aiRow]}>
              <Text style={styles.senderLabel}>ผู้ช่วยเกษตรอัจฉริยะ</Text>
              <View style={[styles.bubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#2e7d32" />
                <Text style={styles.loadingText}>กำลังพิมพ์คำตอบ...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* แถบพิมพ์ข้อความด้านล่าง */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="พิมพ์คำถามหรือกดไมโครโฟน..."
            placeholderTextColor="#888"
            value={prompt}
            onChangeText={(text) => {
              setPrompt(text);
              if (isListening) voiceBasePromptRef.current = text.trimEnd();
            }}
            onKeyPress={handleKeyPress}
            blurOnSubmit={false}
            multiline
          />
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleVoiceInput}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'หยุดฟังเสียง' : 'เริ่มพูดคำถาม'}
          >
            <Text style={styles.micButtonText}>{isListening ? '⏹️' : '🎙️'}</Text>
          </TouchableOpacity>
          {loading ? (
            <TouchableOpacity
              style={[styles.sendButton, styles.stopButton]}
              onPress={stopAI}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="หยุดการคิดคำตอบ"
            >
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, !prompt.trim() && styles.sendButtonDisabled]}
              onPress={askAI}
              disabled={!prompt.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>ส่ง</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dce5dc',
  },
  backButton: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  backButtonText: {
    color: '#1b5e20',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1b5e20',
    flex: 1,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 14,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  aiRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderLabel: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2e7d32',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#dce5dc',
  },
  errorBubble: {
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 23,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#222222',
  },
  errorText: {
    color: '#c62828',
  },
  loadingText: {
    fontSize: 15,
    color: '#555',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#dce5dc',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8faf8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#c8d6c8',
    fontSize: 16,
    color: '#222',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#c8d6c8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a',
  },
  micButtonText: {
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  stopButton: {
    width: 44,
    paddingHorizontal: 0,
    backgroundColor: '#1f2937',
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});