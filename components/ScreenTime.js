import { StyleSheet, Text, View, KeyboardAvoidingView,Keyboard, TouchableWithoutFeedback,Platform,Animated, Pressable, TextInput, Dimensions } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import CircularProgress from 'react-native-circular-progress-indicator';
import Entypo from '@expo/vector-icons/Entypo';
import BottomSheet from "react-native-gesture-bottom-sheet";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const ScreenTime = ({hours,minutes,displayScreenTime,setDisplayScreenTime}) => {
    const screenTimeText = `${hours}h ${minutes}m`
    const totalMinutes = ((hours*60) + minutes);
    const bottomSheet = useRef();

    const [value,setValue] = useState(0);
    const [circleTextColour,setCircleTextColour] = useState("");
    const [outerCircleColour,setOuterCircleColour] = useState("");
    const [innerCircleColour,setInnerCircleColour] = useState("");

    const [bottomSheetHeight, setBottomSheetHeight] = useState(new Animated.Value(400));
    const [expanded, setExpanded] = useState(false); 

    const [inputHours,setInputHours] = useState(0);
    const [inputMinutes,setInputMinutes] = useState(0);

    const circleColours = [
        {
            text: '#00A0F0',
            outerCircleColour: '#52C5FF',
            innerCircleColour: '#00AAFF',
        },
        {
            text: '#D1D100',
            outerCircleColour: '#FFFF92',
            innerCircleColour: '#FFFF00',
        },
        {
            text: '#CE8D01',
            outerCircleColour: '#FFD06A',
            innerCircleColour: '#FFAE00',
        },
        {
            text: '#E70000',
            outerCircleColour: '#FF7171',
            innerCircleColour: '#FF0000',
        },
        {
            text: '#B20000',
            outerCircleColour: '#B44545',
            innerCircleColour: '#B20000',
        },
    ]

    useEffect(()=>{
        let h = Number(hours);
        let m = Number(minutes);  

        let selectedColours;
        let time = hours>12 ? totalMinutes*10/1440 : (hours>8 ? totalMinutes*10/720 : totalMinutes*10/480);
        setValue(time);

        if(h>=8){
            selectedColours = circleColours[4];
        }
        else if(h<8 && h>=6){
            selectedColours = circleColours[3];
        }
        else if(h<6 && h>=4){
            selectedColours = circleColours[2];
        }
        else if(h<4 && h>=2){
            selectedColours = circleColours[1];
        }
        else{
            selectedColours = circleColours[0];
        }
        setCircleTextColour(selectedColours["text"])
        setInnerCircleColour(selectedColours["innerCircleColour"])
        setOuterCircleColour(selectedColours["outerCircleColour"])

    },[totalMinutes,displayScreenTime])

    const toggleBottomSheet = () => {
        Animated.timing(bottomSheetHeight, {
          toValue: expanded ? 300 : Dimensions.get('window').height * 0.85,
          duration: 100, // Animation duration in milliseconds
          useNativeDriver: false, // You need to set this to false as height is not a transformable property
        }).start();
        setExpanded(!expanded); // Toggle the state
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                {
                    circleTextColour!=undefined && outerCircleColour!=undefined && innerCircleColour!=undefined
                    ?
                    <View style={styles.screenTimeContainer}>
                        <View style={styles.header}>
                            <Pressable onPress={() => {
                                setDisplayScreenTime(false)
                            }} style={[styles.backContainer,{zIndex: 1}]}>
                                <AntDesign name="arrowleft" size={24} color="black" />
                            </Pressable>
                            <Text style={styles.screenTimeText}>Screen Time</Text>
                        </View>
                        <View style={styles.progressCircleContainer}>
                            <CircularProgress
                                value={value}
                                title={screenTimeText}
                                radius={120}
                                titleColor={circleTextColour}
                                titleFontSize={25}
                                activeStrokeColor={innerCircleColour}
                                inActiveStrokeColor={outerCircleColour}
                                inActiveStrokeOpacity={0.5}
                                inActiveStrokeWidth={40}
                                activeStrokeWidth={20}
                                showProgressValue={false}
                                titleStyle={{fontFamily: 'MontserratMedium'}}
                            />
                            <Pressable onPress={() => bottomSheet.current.show()} style={styles.logTimePressable}>
                                <Text style={{fontFamily: 'MontserratMedium',}}>Log App Time</Text>
                                <Entypo name="plus" size={25} color="black" />
                            </Pressable>
                        </View>
                        <BottomSheet hasDraggableIcon ref={bottomSheet} height={bottomSheetHeight} radius={30} sheetBackgroundColor="#fff">
                            {
                                !expanded
                                ?
                                <View style={styles.bottomSheetContainer}> 
                                    <View style={styles.bottomSheetHeader}>
                                        <FontAwesome6 name="hourglass-empty" size={40} color="black" />
                                        <Text style={{fontFamily: 'MontserratSemiBold',fontSize: 20,marginLeft:20}}>App Time</Text>
                                    </View>
                                    <View style={{display: 'flex',flexDirection: 'column'}}>
                                        <Pressable style={styles.selectAppBox} onPress={toggleBottomSheet}>
                                            <Text style={styles.inputText}>Select App</Text>
                                            <Entypo name="plus" size={25} color="black" />
                                        </Pressable>
                                        {/* <View style={styles.inputRow}>
                                            <View style={styles.inputRowComponent}>
                                                <TextInput
                                                    value={inputHours}
                                                    placeholder="00"
                                                    onChangeText={setInputHours}
                                                    style={styles.input}
                                                    keyboardType="numeric"
                                                    placeholderTextColor="#cfcfcf"
                                                />
                                                <Text style={styles.inputText}>Hours</Text>
                                            </View>
                                            <View style={styles.inputRowComponent}>
                                                <TextInput
                                                    value={inputMinutes}
                                                    placeholder="00"
                                                    onChangeText={setInputMinutes}
                                                    style={styles.input}
                                                    keyboardType="numeric"
                                                    placeholderTextColor="#cfcfcf"
                                                />
                                                <Text style={styles.inputText}>Minutes</Text>
                                            </View>
                                        </View> */}
                                    </View>
                                    <Pressable style={styles.logBtn}>
                                        <Text style={{fontFamily: 'MontserratSemiBold',color: '#fff'}}>Log</Text>
                                    </Pressable>
                                </View>
                                :
                                <View style={styles.bottomSheetContainer}>
                                    <View style={styles.bottomSheetSearchHeader}>
                                        <Pressable style={styles.collapseBottomSheet} onPress={toggleBottomSheet}>
                                            <AntDesign name="arrowleft" size={25} color="black" />
                                        </Pressable>
                                        <View style={{position: 'relative',width: '80%', alignItems: 'center', justifyContent: 'center' }}>
                                            <TextInput style={styles.searchInput} placeholder='Which app are you looking for?' placeholderTextColor="#636363"/>
                                            <AntDesign style={{ position: 'absolute', left: 15, top: '50%', transform: [{ translateY: -12 }] }}  name="search1" size={20} color="#636363" />
                                        </View>
                                    </View>
                                </View>
                            }
                        </BottomSheet>
                    </View>
                    :
                    <View></View>
                }
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default ScreenTime

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f4f4',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingHorizontal: 15
    },
    screenTimeText: {
        fontSize: 20,
        fontFamily: 'MontserratMedium',
        color: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
        zIndex: 1
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    screenTimeContainer: {
        width: '100%',
        height: '100%',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative'
    },
    progressCircleContainer: {
        display: 'flex',
        height: '100%',
        justifyContent: 'space-around',
        width: '100%',
        alignItems: 'center'
    },
    logTimePressable: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bottomSheetContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '90%',
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    bottomSheetHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    selectAppBox: {
        marginTop: 30,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        padding: 20,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#f5f4f4',
        borderRadius: 10,
    },
    inputRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: 20,
        width: '80%'
    },
    inputRowComponent: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },  
    input: {
        height: 50,
        width: 50,
        backgroundColor: '#F5F4F4',
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'MontserratMedium',
        color: '#000',
        borderRadius: 5,
        marginRight: 20,
    },
    inputText: {
        fontSize: 15,
        fontFamily: 'MontserratMedium',
        color: '#404040',
    },
    logBtn: {
        backgroundColor: '#000',
        width: '80%',
        padding: 20,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchInput: {
        width: '100%',
        padding: 20,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#f5f4f4',
        paddingLeft: 45
    },
    bottomSheetSearchHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    collapseBottomSheet: {
        marginRight: 10
    }
})