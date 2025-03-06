import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

type XPChartModalProps = {
  visible: boolean;
  onClose: () => void;
  category: string;
  xpData: {
    labels: string[];
    data: number[];
  };
  currentLevel: number;
  totalXP: number;
};

export function XPChartModal({ visible, onClose, category, xpData, currentLevel, totalXP }: XPChartModalProps) {
  const averageXP = xpData.data.length > 0 
    ? Math.round((xpData.data[xpData.data.length - 1] - (xpData.data[0] || 0)) / xpData.data.length)
    : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.header}>
              <ThemedText style={styles.title}>
                {category.charAt(0).toUpperCase() + category.slice(1)} XP
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.statsContainer}>
              <ThemedView style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Level</ThemedText>
                <ThemedText style={[styles.statValue, { color: '#FFD700' }]}>
                  {currentLevel}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Total XP</ThemedText>
                <ThemedText style={styles.statValue}>
                  {totalXP.toLocaleString()}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Avg. XP/Session</ThemedText>
                <ThemedText style={styles.statValue}>
                  {averageXP.toLocaleString()}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: xpData.labels,
                  datasets: [{
                    data: xpData.data.length > 0 ? xpData.data : [0]
                  }]
                }}
                width={Dimensions.get('window').width - 48}
                height={220}
                chartConfig={{
                  backgroundColor: '#1c1c1e',
                  backgroundGradientFrom: '#1c1c1e',
                  backgroundGradientTo: '#1c1c1e',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#FFD700'
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#333',
                  },
                  formatYLabel: (value) => parseInt(value).toLocaleString(),
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
              />
            </View>

            <ThemedText style={styles.subtitle}>
              XP Progress Over Last {xpData.labels.length} Sessions
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FFD700',
    borderStyle: 'solid',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
    position: 'relative',
    backgroundColor: '#1c1c1e',
  },
  title: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    textDecorationLine: 'line-through',
    textDecorationColor: '#FFD700',
    backgroundColor: '#1c1c1e',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
    backgroundColor: '#1c1c1e',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 4,
    backgroundColor: '#1c1c1e',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#fff',
    backgroundColor: '#1c1c1e',
  },
  chartContainer: {
    alignItems: 'center',
    marginLeft: -36,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginTop: 16,
    backgroundColor: '#1c1c1e',
  },
}); 