package log

import (
	"fmt"
	"log"
	"os"
)

type Severity string

const (
	Severity_Info  Severity = "INFO"
	Severity_Error Severity = "ERROR"
	Severity_Fatal Severity = "FATAL"
)

func init() {
	log.SetFlags(0)
}

func Infof(format string, v ...interface{}) {
	logf(Severity_Info, format, v...)
}

func Errorf(format string, v ...interface{}) {
	logf(Severity_Error, format, v...)
}

func Fatalf(format string, v ...interface{}) {
	logf(Severity_Fatal, format, v...)
}

func logf(s Severity, format string, v ...interface{}) {
	log.Printf(prependSeverity(format, s), v...)
	if s == Severity_Fatal {
		os.Exit(1)
	}
}

// "some message %d", "ERROR" -> "ERROR: some message %d"
func prependSeverity(format string, severity Severity) string {
	return fmt.Sprintf("%s: %s", severity, format)
}
