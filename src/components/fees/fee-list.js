import React, { Component } from "react";
import StudentDataService from "../../services/student.service";

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import MaterialTable from 'material-table';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles } from '@material-ui/core/styles';
import DateFnsUtils from '@date-io/date-fns';
import { DatePicker, MuiPickersUtilsProvider, } from "@material-ui/pickers";
import { DataGrid } from '@material-ui/data-grid';

import { formatDateToString, weekday, roomNums } from '../../resources';

const styles = theme => ({
  root: {
    margin: '20px'
  },
  sub: {
    '& > *': {
      margin: theme.spacing(1),
    },
  }
})

const columns = [
  { title: 'Name', field: 'name' },
  { title: 'Grade', field: 'grade' },
  { title: 'Contact', field: 'phoneNum', width: 150},
  { title: 'Address', field: 'address', width: 250 },
  { title: 'Notes', field: 'notes', width: 200 },
];

const columnsOfClasses = [
  { title: 'Year', field: 'grade' },
  { title: 'Subject', field: 'subject' },
  { title: 'Day', field: 'day' },
  { title: 'Start Time', field: 'startTime' },
  { title: 'End Time', field: 'endTime' },
  { title: 'Teacher', field: 'teacher' },
  { title: 'Type', field: 'type' },
  { title: 'Room', field: 'roomNum' },
  { title: 'Notes', field: 'notes' },
  { title: 'Fee', field: 'fee' }
];

function renameKey ( obj ) {
  var start = new Date(obj.startDate);
  var end = new Date(obj.endDate);
  obj["day"] = weekday[start.getDay()];
  obj["startTime"] = formatDateToString(start);
  obj["endTime"] = formatDateToString(end);
  obj["subject"] = obj.subject.name;
  obj["teacher"] = obj.teacher.name;
  obj["roomNum"] = roomNums[obj.roomNum];
  obj["fee"] = "£" + findFee(obj);
}

function findFee(tutorial) {
  var fee;
  if (tutorial.grade <= 'Y9') {
    fee = {
      "Group": 20,
      "Private": 30
    }
  } else if (tutorial.grade <= 'Y11') {
    fee = {
      "Group": 23,
      "Private": 35
    }
  } else {
    return "?";
  }
  return fee[tutorial.type];
}

class FeeList extends Component {
  constructor(props) {
    super(props);
    this.retrieveStudents = this.retrieveStudents.bind(this);
    this.setActiveStudent = this.setActiveStudent.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.findTotalFee = this.findTotalFee.bind(this);

    this.state = {
      students: [],
      currentStudent: null,
      open: false,
      selectedRow: 0,
      date: new Date(),
      tutorials: null,
      message: "",
      week: "",
      month: ""
    };
  }

  componentDidMount() {
    this.retrieveStudents();
  }

  retrieveStudents() {
    StudentDataService.getAll()
      .then(response => {
        this.setState({
          students: response.data
        });
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  setActiveStudent(student) {
    const newS = student;
    newS.tutorials.forEach( obj => renameKey(obj) );
    this.setState({
      currentStudent: newS,
      selectedRow: newS.id,
      tutorials: newS.tutorials
    });
  }

  getStudent(id) {
    StudentDataService.get(id)
      .then(response => {
        this.setState({
          currentStudent: response.data
        });
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  handleClose() {
    this.setState({
      open: false
    });
  }

  handleClick() {
    this.setState({
      open: true,
    });
    this.findTotalFee();
  }

  dateChange(date) {
    const newDate = date;
    this.setState({
      date: newDate
    });
  }

  occurrenceDays() {
    const numOfDays = new Date(this.state.date.getFullYear(), this.state.date.getMonth() + 1, 0).getDate();
    const firstday = new Date(this.state.date.getFullYear(), this.state.date.getMonth(), 1).getDay();
    var count = Array(7).fill(4);
  
    // number of days whose occurrence will be 5 
    const inc = numOfDays - 28;
  
    for (var i = firstday; i < (firstday+inc); i ++) {
      if (i > 6) {
        count[i % 7] = 5;
      } else {
        count[i] = 5;
      }
    }
  
    return count;
  }

  findTotalFee() {
  const arrOfOccurrenceDays = this.occurrenceDays();

  var fee;
  if (this.state.currentStudent.grade <= 'Y9') {
    fee = {
      "Group": 20,
      "Private": 30
    }
  } else if (this.state.currentStudent.grade <= 'Y11') {
    fee = {
      "Group": 23,
      "Private": 35
    }
  } else {
    this.setState({
      message: "Unknown Fees",
    });
    return;
  }
  const tutorials = this.state.tutorials;
  var weeklyTotal = 0;
  var monthlyTotal = 0;

  // Calculate the total of fees for a week
  for (var i = 0; i < tutorials.length; i++) {
    weeklyTotal += fee[tutorials[i].type];
    monthlyTotal += fee[tutorials[i].type] * arrOfOccurrenceDays[new Date(tutorials[i].startDate).getDay()];
  }
  this.setState({
    open: true,
    week: "£"+weeklyTotal,
    month: "£"+monthlyTotal
  });
  return;
}

  render() {
    const { classes } = this.props;
    const { students, currentStudent, tutorials, open, date } = this.state;

    return (
      <>
      <Grid
        container
        item
        direction="row"
        justify="center"
        alignItems="flex-start"
        className={classes.root}
      >
        {/* <Grid item className={classes.sub}>
          <MaterialTable
            title="Select Student"
            columns={columns}
            data={students}
            onRowClick={((evt, selectedRow) => this.setActiveStudent(selectedRow))}
            options={{
              grouping: true,
              pageSize: 5,
              rowStyle: rowData => ({
                backgroundColor: (this.state.selectedRow === rowData.id) ? '#EEE' : '#FFF'
              })
            }}
          />
        </Grid> */}
        <div style={{ height: 350, width: '800px' }}>
          <DataGrid rows={students} columns={columns} pageSize={10} onRowClick={((row)=>this.setActiveStudent(row.data))} />
        </div>
        {tutorials ? (
          <Grid 
            item
            justify="center"
            className={classes.sub}
          >
            <MaterialTable
              title="Classes"
              columns={columnsOfClasses}
              data={tutorials}
              options={{
                grouping: true,
                pageSize: 5,
              }}
            />
          </Grid>
        ):(
          <></>
        )}
      </Grid>

      <Grid
        container
        direction="row"
        justify="center"
        alignItems="flex-start"
        style={{marginBottom: "20px"}}
      >
      <Grid item>
        <Paper>
          <ListSubheader component="div" id="nested-list-subheader">
            Please Select A Month
          </ListSubheader>
        </Paper>
        <Paper className={classes.sub}>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DatePicker
              autoOk
              disableToolbar={true}
              orientation="landscape"
              variant="static"
              openTo="date"
              value={date}
              onChange={(date) => this.dateChange(date)}
            />
          </MuiPickersUtilsProvider>
        </Paper>
        {tutorials ? (
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            fullWidth={true} 
            onClick={this.findTotalFee}
          >
            Calculate fee
          </Button>
        ): (
          <></>
        )}
      </Grid>
        
      {open ? (
        <Grid item className={classes.sub}>
          <Paper elevation={3} className={classes.sub} styles={{paddingBottom: "10px"}}>
          <List
            component="nav"
            aria-labelledby="nested-list-subheader"
          >
            <ListSubheader component="div" id="nested-list-subheader">
              Weekly Total Fee For {currentStudent.name}
            </ListSubheader>
            <ListItem>
              <ListItemText primary={this.state.week} />
            </ListItem>
            <ListSubheader component="div" id="nested-list-subheader">
              Monthly Total Fee For {currentStudent.name}
            </ListSubheader>
            <ListItem>
              <ListItemText primary={this.state.month} />
            </ListItem>
            </List>
          </Paper>
        </Grid>
      ):(
        <></>
      )}
      </Grid>
      </>
    );
  }
}

export default withStyles(styles)(FeeList);