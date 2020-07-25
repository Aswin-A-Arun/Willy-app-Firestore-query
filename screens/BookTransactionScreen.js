import React from 'react';
import { Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import * as Permissions from 'expo-permissions' ;
import {BarcodeScanner} from 'expo-barcode-scanner';

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedBookId:'',
      scannedStudentId:'',
      buttonState: 'normal'
    }
  }
  getCameraPermissions = async (id) => {
    const {status} = await Permissions.askAsync(Permissions.CAMERA);
    
    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions: status === "granted",
      buttonState: id, 
      scanned: false
    });
  }
  handleBarCodeScanned = async({type, data})=>{
    const {buttonState} = this.state

    if (buttonState==="BookId"){
    this.setState({
      scanned: true,
      scannedData: data,
      buttonState: 'normal'
     });
  }
  else if(buttonState==="StudentId"){
    this.setState({
      scanned: true,
      scannedStudentid:data,
      buttonState: "normal"
    });
  }
  initiateBookissue = async()=>{
     //add a transaction
     db.collection("transactions").add({
      'studentId' : this.state.scannedStudentid,
      'bookId' : this.state.scannedBookId,
      'date' : firebase.firestore.Timestamp.now().todate(),
      'transactionType' : "Issue"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : false
    })
   db.collection("Students").doc(this.setState.scannedStudentId).update({
      'numberOfBooksIssued': firebase.firestore.fieldsValue.increment(1)
    })

    Alert.alert("Book Issued!")

    this.setState(
      {scannedBookId:'',
      scannedStudentId:''})
  }


  initiateBookReturn = async()=>{
    //add a transaction
   db.collection("transactions").add({
      'studentId' : this.state.scannedStudentid,
      'bookId' : this.state.scannedBookId,
      'date' : firebase.firestore.Timestamp.now().toDate(),
      'transactiotype': "Return"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : true
    })
    db.collection("Students").doc(this.setState.scannedStudentId).update({
      'numberOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
    })

    Alert.alert("Book Returned!")
    this.setState(
      {scannedBookId:'',
      scannedStudentId:''
    })
  }
  checkBookEligibility = async()=>{
    const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
    var transactionType = ""
    if(bookRef.docs.length == 0){
      transactionType = false;
      console.log(bookRef.docs.length)
    }
    else{
      bookRef.docs.map((doc)=>{
        var book = doc.data()
        if (book.bookAvailability){
          transactionType = "Issue"
        }
        else{
          transactionType = "Return"
        }
      })
    }

    return transactionType

  }

  checkStudentEligibilityForBookIssue = async()=>{
    const studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
    var isStudentEligible = ""
    if(studentRef.docs.length == 0){
      this.setState({
        scannedStudentId: '',
        scannedBookId: ''
      })
      isStudentEligible = false
      Alert.alert("The student id doesn't exist in the database!")
    }
    else{
       studentRef.docs.map((doc)=>{
          var student = doc.data();
          if(student.numberOfBooksIssued < 2){
            isStudentEligible = true
          }
          else{
            isStudentEligible = false
            Alert.alert("The student has already issued 2 books!")
            this.setState({
              scannedStudentId: '',
              scannedBookId: ''
            })
          }

        })

    }

    return isStudentEligible

  }

  checkStudentEligibilityForReturn = async()=>{
    const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
    var isStudentEligible = ""
    transactionRef.docs.map((doc)=>{
      var lastBookTransaction = doc.data();
      if(lastBookTransaction.studentId === this.state.scannedStudentId){
        isStudentEligible = true
      }
      else {
        isStudentEligible = false
        Alert.alert("The book wasn't issued by this student!")
        this.setState({
          scannedStudentId: '',
          scannedBookId: ''
        })
      }
    })
    return isStudentEligible
  }
  //HandleTransactionFunction Here
  handleTransaction = async()=>{
     //verify if the student is eligible for book issue or return or none
            //student id exists in the database
            //issue : number of book issued < 2
            //issue: verify book availability
            //return: last transaction -> book issued by the student id
    var transcationtype = await this.checkBookEligibility();
    console.log("Transaction Type", transactiontype)
    if(!transactionType) {
      Alert.alert("the book doesn't exist in the library database!")
      this.setState({
        scannedStudentId:'',
        scannedBookId:''
      })
    }
    db.collection("books").doc(this.state.scannedBookId).get()
    .then((doc)=>{
      var book = doc.data()
      if(book.bookAvailability){
        this.initiatBookIssue();
        transactionMessage = "Book Issued"
       
      }
      else{
        this.initiateBookReturn();
        transactionMessage = "Book Returned"
      }
      this.setState({
        transactionMessage: transactionMessage
      })
    })
  }
    render(); {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;
    }
      if (buttonState === "clicked" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );         
    }
      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container}></KeyboardAvoidingView> 
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            //add submit button here
              
<TouchableOpacity
style = {styles.submitbutton}>
  <Text style = {styles.submitbuttonText}>Submit</Text>
</TouchableOpacity>
            ) 
        }
    }
  }
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
      backgroundColor: '#FBC020',
      width: 100,
      height: 50
    },
    submitButtonText: {
      padding: '10',
      textAlign: 'center',
      fontSize: 20,
      fontweight: "bold",
      color: 'white'
    }
  });