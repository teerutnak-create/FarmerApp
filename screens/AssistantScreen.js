import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';

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
  const scrollViewRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

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

    try {
      const apiUrl = '/api/assistant';

      // ส่งประวัติการคุย (ตัดข้อความต้อนรับเริ่มต้นออก) เพื่อให้ AI จำบริบทต่อเนื่องได้
      const historyForApi = updatedMessages
        .filter((m) => m.id !== 'welcome')
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          context: props.context || '',
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'เกิดข้อผิดพลาด: ' + err.message,
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
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
            placeholder="พิมพ์คำถามแล้วกด Enter..."
            placeholderTextColor="#888"
            value={prompt}
            onChangeText={setPrompt}
            onKeyPress={handleKeyPress}
            blurOnSubmit={false}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!prompt.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={askAI}
            disabled={!prompt.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonText}>ส่ง</Text>
          </TouchableOpacity>
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
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});